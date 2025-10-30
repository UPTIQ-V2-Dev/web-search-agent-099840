import prisma from "../client.js";
import ApiError from "../utils/ApiError.js";
import { encryptPassword } from "../utils/encryption.js";
import httpStatus from 'http-status';
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<Omit<User, 'password'>>}
 */
const createUser = async (email, password, name, role = 'USER') => {
    if (await getUserByEmail(email, true)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input or email already exists');
    }
    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: await encryptPassword(password),
            role
        }
    });
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
/**
 * Query for users
 * @param {Object} filter - Prisma filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy;
    // Build where clause for filtering
    const where = {};
    if (filter.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
    }
    if (filter.role) {
        where.role = filter.role;
    }
    // Parse sortBy if provided (format: field:direction)
    let orderBy = undefined;
    if (sortBy) {
        const [field, direction] = sortBy.split(':');
        orderBy = { [field]: direction || 'asc' };
    }
    // Get total count for pagination
    const totalResults = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalResults / limit);
    // Get users without password
    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy
    });
    return {
        results: users,
        page,
        limit,
        totalPages,
        totalResults
    };
};
/**
 * Get user by id
 * @param {number} id
 * @param {boolean} includePassword - Whether to include password field (for internal use only)
 * @returns {Promise<Omit<User, 'password'> | User | null>}
 */
const getUserById = async (id, includePassword = false) => {
    if (includePassword) {
        // For internal use (authentication, etc.)
        return await prisma.user.findUnique({
            where: { id }
        });
    }
    else {
        // For API responses - exclude password
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
};
/**
 * Get user by email
 * @param {string} email
 * @param {boolean} includePassword - Whether to include password field (for internal use only)
 * @returns {Promise<Omit<User, 'password'> | User | null>}
 */
const getUserByEmail = async (email, includePassword = false) => {
    if (includePassword) {
        // For internal use (authentication, etc.)
        return await prisma.user.findUnique({
            where: { email }
        });
    }
    else {
        // For API responses - exclude password
        return await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
};
/**
 * Update user by id
 * @param {number} userId
 * @param {Object} updateBody
 * @returns {Promise<Omit<User, 'password'>>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId, true);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    // Check if email already exists (if email is being updated)
    if (updateBody.email && updateBody.email !== user.email) {
        const existingUser = await getUserByEmail(updateBody.email, true);
        if (existingUser) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid input or email already exists');
        }
    }
    // Hash password if it's being updated
    if (updateBody.password) {
        updateBody.password = await encryptPassword(updateBody.password);
    }
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateBody,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });
    return updatedUser;
};
/**
 * Delete user by id
 * @param {number} userId
 * @returns {Promise<void>}
 */
const deleteUserById = async (userId) => {
    const user = await getUserById(userId, true);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await prisma.user.delete({ where: { id: userId } });
};
export default {
    createUser,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById
};
