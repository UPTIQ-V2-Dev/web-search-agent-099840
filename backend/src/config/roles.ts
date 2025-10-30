const allRoles = {
    USER: ['search'],
    ADMIN: ['getUsers', 'manageUsers', 'search', 'manageSearch']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
