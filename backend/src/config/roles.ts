import { Role } from '../generated/prisma/index.js';

const allRoles = {
    [Role.USER]: ['search'],
    [Role.ADMIN]: ['getUsers', 'manageUsers', 'search', 'manageSearch']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
