import { userService } from "../services/index.js";
import pick from "../utils/pick.js";
import { z } from 'zod';
const userSchema = z.object({
    id: z.number(),
    email: z.string(),
    name: z.string().nullable(),
    role: z.string(),
    isEmailVerified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string()
});
const createUserTool = {
    id: 'user_create',
    name: 'Create User',
    description: 'Create a new user (admin only)',
    inputSchema: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string(),
        role: z.enum(['USER', 'ADMIN'])
    }),
    outputSchema: userSchema,
    fn: async (inputs) => {
        const user = await userService.createUser(inputs.email, inputs.password, inputs.name, inputs.role);
        return user;
    }
};
const getUsersTool = {
    id: 'user_get_all',
    name: 'Get All Users',
    description: 'Get all users with optional filters and pagination (admin only)',
    inputSchema: z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        sortBy: z.string().optional(),
        limit: z.number().int().optional(),
        page: z.number().int().optional()
    }),
    outputSchema: z.object({
        results: z.array(userSchema),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        totalResults: z.number()
    }),
    fn: async (inputs) => {
        const filter = pick(inputs, ['name', 'role']);
        const options = pick(inputs, ['sortBy', 'limit', 'page']);
        const result = await userService.queryUsers(filter, options);
        return result;
    }
};
const getUserTool = {
    id: 'user_get_by_id',
    name: 'Get User By ID',
    description: 'Get a single user by their ID',
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: userSchema,
    fn: async (inputs) => {
        const user = await userService.getUserById(inputs.userId, false);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
};
const updateUserTool = {
    id: 'user_update',
    name: 'Update User',
    description: 'Update user information by ID',
    inputSchema: z.object({
        userId: z.number().int(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(8).optional()
    }),
    outputSchema: userSchema,
    fn: async (inputs) => {
        const updateBody = pick(inputs, ['name', 'email', 'password']);
        const user = await userService.updateUserById(inputs.userId, updateBody);
        return user;
    }
};
const deleteUserTool = {
    id: 'user_delete',
    name: 'Delete User',
    description: 'Delete a user by their ID',
    inputSchema: z.object({
        userId: z.number().int()
    }),
    outputSchema: z.object({}),
    fn: async (inputs) => {
        await userService.deleteUserById(inputs.userId);
        return {};
    }
};
export const userTools = [createUserTool, getUsersTool, getUserTool, updateUserTool, deleteUserTool];
