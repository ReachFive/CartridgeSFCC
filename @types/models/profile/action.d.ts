/**
 * Action descriptor for ReachFive profile object.
 */
export interface ActionDescriptor {
    data: string;
    type: 'simpleMethod' | 'customProperty' | 'function';
    set: string;
    get: string;
}

/**
 * Type for the actions object.
 */
export interface ActionsObject {
    [key: string]: ActionDescriptor;
}
