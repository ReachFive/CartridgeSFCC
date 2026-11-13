# Deploys the ReachFive cartridges to an SFCC sandbox as a new code version.
#
#   make env        once: write .env with the instance and the Account Manager API client
#   make auth       every 30 min or so: get an sfcc-ci token
#   make deploy     create a new code version on INSTANCE
#   make activate   activate it
#
# `make deploy` never changes an existing code version. On the instance, it:
#   1. copies SOURCE (the active code version by default) to a new code version,
#      with the WebDAV COPY method, so the base cartridges (app_storefront_base,
#      modules...) are kept without downloading them;
#   2. deletes CARTRIDGES from that copy;
#   3. uploads CARTRIDGES as committed on REF (`git archive`, not the working copy).
# Rolling back is `make activate VERSION=<the previous active version>`.
#
# Permissions the API client needs on INSTANCE, in Business Manager:
#   - WebDAV Client Permissions: `/cartridges`, read_write (deploy);
#   - Open Commerce API Settings, Data, Global: `/code_versions` get and
#     `/code_versions/*` get, patch (versions, activate, and finding the active version).
#
# The instance and the credentials are read from .env (gitignored), which `make env`
# writes, so no hostname or secret is committed:
#   INSTANCE=<sandbox>.dx.commercecloud.salesforce.com
#   SFCC_OAUTH_CLIENT_ID=...
#   SFCC_OAUTH_CLIENT_SECRET=...

-include .env
export SFCC_OAUTH_CLIENT_ID
export SFCC_OAUTH_CLIENT_SECRET

INSTANCE     ?=
REF          ?= main
CARTRIDGES   ?= int_reachfive int_reachfive_sfra
QUALIFIER    ?= $(subst /,-,$(REF))
SOURCE       ?=

BUILD_DIR    := build
LAST_VERSION := $(BUILD_DIR)/last-version
SFCC_CI      := npx --yes sfcc-ci
WEBDAV       := https://$(INSTANCE)/on/demandware.servlet/webdav/Sites/Cartridges
SHELL        := /bin/bash
.DEFAULT_GOAL := help

# A new name on every deploy, so a deploy never lands on an existing version.
# `make activate` reuses the name of the last deploy.
ifeq ($(MAKECMDGOALS),activate)
VERSION      ?= $(shell cat $(LAST_VERSION) 2>/dev/null)
else
VERSION      ?= $(shell date +%Y%m%d-%H%M)_$(QUALIFIER)
endif

# Prints the ID of the active code version, or of the version named $1 if it exists.
PICK_VERSION := node -e 'let s = ""; process.stdin.on("data", d => s += d).on("end", () => { const n = process.argv[1] || ""; const v = (JSON.parse(s).data || []).find(v => n ? v.id === n : v.active); if (v) console.log(v.id); })'
find_version = $(SFCC_CI) code:list -j -i $(INSTANCE) | $(PICK_VERSION) "$(1)"

.PHONY: help env auth instances versions deploy activate clean check-instance

# Targets that talk to the instance depend on this one.
check-instance:
	@test -n "$(INSTANCE)" || { echo "INSTANCE is missing, run make env"; exit 1; }

help:
	@echo "Deploy the ReachFive cartridges to an SFCC sandbox as a new code version."
	@echo ""
	@echo "First time:"
	@echo "  make env                  write .env: instance and Account Manager API client"
	@echo ""
	@echo "Deploy:"
	@echo "  make auth                 get an sfcc-ci token (lasts about 30 min)"
	@echo "  make deploy               copy SOURCE to a new version, with CARTRIDGES from REF"
	@echo "  make activate             activate the last deployed version (or VERSION=...)"
	@echo ""
	@echo "Other:"
	@echo "  make versions             list the code versions on INSTANCE"
	@echo "  make instances            list the instances the client can reach"
	@echo "  make clean                remove $(BUILD_DIR)/"
	@echo ""
	@echo "Variables (make deploy REF=my-branch ...):"
	@echo "  INSTANCE=$(or $(INSTANCE),<not set: run make env>)"
	@echo "  REF=$(REF)"
	@echo "  CARTRIDGES=$(CARTRIDGES)"
	@echo "  SOURCE=$(or $(SOURCE),<the active version>)"
	@echo "  last deployed version: $(or $(shell cat $(LAST_VERSION) 2>/dev/null),<none>)"

# The .env file is read with make syntax: $ is written as $$ and # as \#.
# make cannot keep a backslash or a leading or trailing space, so those are refused.
# Pressing Enter keeps the value already in .env.
env:
	@old_instance="$(INSTANCE)"; old_id="$$SFCC_OAUTH_CLIENT_ID"; \
	old_secret=$$(grep -s '^SFCC_OAUTH_CLIENT_SECRET=' .env | cut -d= -f2-); \
	read -r -p "Instance hostname$${old_instance:+ [$$old_instance]}: " instance; \
	instance=$${instance:-$$old_instance}; \
	read -r -p "API Client ID (Account Manager)$${old_id:+ [$$old_id]}: " id; \
	id=$${id:-$$old_id}; \
	IFS= read -r -s -p "API Client password (hidden)$${old_secret:+ [Enter keeps the current one]}: " secret; echo; \
	[ -n "$$instance" ] && [ -n "$$id" ] && [ -n "$$secret$$old_secret" ] || { echo "the three values are required"; exit 1; }; \
	[[ "$$instance" =~ ^[A-Za-z0-9.-]+$$ ]] || { echo "the instance is a hostname, such as abcd-001.dx.commercecloud.salesforce.com"; exit 1; }; \
	[[ "$$id" =~ ^[A-Za-z0-9-]+$$ ]] || { echo "the client ID only contains letters, digits and dashes"; exit 1; }; \
	if [ -n "$$secret" ]; then \
		case "$$secret" in *\\*|' '*|*' ') \
			echo "the password cannot contain a backslash or start or end with a space"; exit 1;; \
		esac; \
		escaped=$$(printf '%s' "$$secret" | sed -e 's/\$$/$$$$/g' -e 's/#/\\#/g'); \
	else \
		escaped=$$old_secret; \
	fi; \
	umask 077; \
	printf 'INSTANCE=%s\nSFCC_OAUTH_CLIENT_ID=%s\nSFCC_OAUTH_CLIENT_SECRET=%s\n' "$$instance" "$$id" "$$escaped" > .env; \
	chmod 600 .env; \
	echo ".env written, next: make auth"

# The variables are read from the environment, not expanded into the recipe, so any
# character in the secret is safe.
auth:
	@test -n "$$SFCC_OAUTH_CLIENT_ID" || { echo "SFCC_OAUTH_CLIENT_ID is missing, run make env"; exit 1; }
	@test -n "$$SFCC_OAUTH_CLIENT_SECRET" || { echo "SFCC_OAUTH_CLIENT_SECRET is missing, run make env"; exit 1; }
	$(SFCC_CI) client:auth

instances:
	$(SFCC_CI) instance:list

versions: check-instance
	$(SFCC_CI) code:list -i $(INSTANCE)

deploy: check-instance
	@git rev-parse --verify --quiet "$(REF)^{commit}" >/dev/null || { echo "unknown git ref: $(REF)"; exit 1; }
	@source="$(SOURCE)"; \
	[ -n "$$source" ] || source=$$($(call find_version,)); \
	[ -n "$$source" ] || { echo "no active code version found on $(INSTANCE) (run make auth?)"; exit 1; }; \
	[ "$$($(call find_version,$$source))" = "$$source" ] || { echo "code version $$source not found on $(INSTANCE)"; exit 1; }; \
	[ -z "$$($(call find_version,$(VERSION)))" ] || { echo "code version $(VERSION) already exists on $(INSTANCE)"; exit 1; }; \
	echo "packaging $(CARTRIDGES) from $(REF) ($$(git rev-parse --short $(REF)))"; \
	rm -rf $(BUILD_DIR)/$(VERSION) && mkdir -p $(BUILD_DIR)/$(VERSION) && \
	git archive $(REF) $(addprefix cartridges/,$(CARTRIDGES)) | tar -x --strip-components=1 -C $(BUILD_DIR)/$(VERSION) && \
	(cd $(BUILD_DIR) && rm -f $(VERSION).zip && zip -rq $(VERSION).zip $(VERSION) -x '*.DS_Store') || exit 1; \
	token=$$($(SFCC_CI) client:auth:token) || exit 1; \
	echo "copying $$source to $(VERSION) on $(INSTANCE)"; \
	status=$$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
		-H "Authorization: Bearer $$token" \
		-H "Destination: /on/demandware.servlet/webdav/Sites/Cartridges/$(VERSION)" \
		--data 'method=COPY' "$(WEBDAV)/$$source"); \
	[ "$$status" = 201 ] || { echo "copy failed: HTTP $$status (WebDAV Client Permissions?)"; exit 1; }; \
	for c in $(CARTRIDGES); do \
		status=$$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
			-H "Authorization: Bearer $$token" "$(WEBDAV)/$(VERSION)/$$c"); \
		case "$$status" in 204|404) ;; \
			*) echo "deleting $$c from $(VERSION) failed: HTTP $$status, delete $(VERSION) in Business Manager"; exit 1;; \
		esac; \
	done; \
	echo "uploading $(CARTRIDGES)"; \
	$(SFCC_CI) code:deploy $(BUILD_DIR)/$(VERSION).zip -i $(INSTANCE) \
		|| { echo "upload failed, delete $(VERSION) in Business Manager"; exit 1; }; \
	echo "$(VERSION)" > $(LAST_VERSION); \
	echo ""; \
	echo "$(VERSION) created from $$source. Next: make activate"; \
	echo "Rollback: make activate VERSION=$$source"

activate: check-instance
	@test -n "$(VERSION)" || { echo "nothing deployed yet: VERSION=... is required"; exit 1; }
	$(SFCC_CI) code:activate $(VERSION) -i $(INSTANCE)

clean:
	rm -rf $(BUILD_DIR)
