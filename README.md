# Reachfive Cartridge for Salesforce B2C Commerce

Repository contains the needed cartridges for both SFRA and SGJC based storefronts.

ReachFive is a CIAM (Customer Idendity and Access Management), providing social media and full authentication features. 
With ReachFive, customers can simplify their authentication process and improve their customer identity management. 
Currently, more than 30 social networks authentications are managed by ReachFive but the number of social networks supported is continuously growing.

As described in the ReachFive website (https://www.reach5.co/), ReachFive provide the following functionalities:
* Single Sign On: sets of API and widget to allow the user to signup, login, manage social account profiles
* Social Login:  allows merchants to integrate OAuth providers registering and login functionalities, manage social account profiles


# The latest version
The latest compatible version of SFRA is 6.3.0
The latest compatible version of SiteGenesis is 18.3 

# Getting Started
For detailed instructions on integration and configuration, please refer to our documentation available at [https://developer.reachfive.com/docs/integration/salesforce.html](https://developer.reachfive.com/docs/integration/salesforce.html). This documentation provides all the necessary information for integrating and configuring the ReachFive Cartridge for Salesforce B2C Commerce, tailored to your site version, whether it's SFRA or SiteGenesis.

# Git Branching Strategy
This GitFlow strategy is composed of the following branches:

- Main branch: Serves as the official release history.
- Development branch: Used as the integration branch for features.
- Feature branches: Used to develop new features derived from the development branch.
- Release branches: Help in preparing a new production release. Typically branched off from the development branch and must be merged back into both development and main branches upon completion.
- Hotfix branches: Facilitate quick fixes for production issues found in the main branch, allowing developers to address bugs without halting ongoing work in the development branch.
