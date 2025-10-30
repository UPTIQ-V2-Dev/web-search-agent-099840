import { userService } from '../services/index.ts';
import ApiError from '../utils/ApiError.ts';
import catchAsyncWithAuth from '../utils/catchAsyncWithAuth.ts';
import pick from '../utils/pick.ts';
import httpStatus from 'http-status';

const createUser = catchAsyncWithAuth(async (req, res) => {
    const { email, password, name, role } = req.body;
    const user = await userService.createUser(email, password, name, role);
    res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsyncWithAuth(async (req, res) => {
    const filter = pick(req.validatedQuery, ['name', 'role']);
    const options = pick(req.validatedQuery, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    res.send(result);
});

const getUser = catchAsyncWithAuth(async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const currentUser = req.user;

    // Check if user is requesting their own data or if they are admin
    if (currentUser.id !== requestedUserId && currentUser.role !== 'ADMIN') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
    }

    const user = await userService.getUserById(requestedUserId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
});

const updateUser = catchAsyncWithAuth(async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const currentUser = req.user;

    // Check if user is updating their own data or if they are admin
    if (currentUser.id !== requestedUserId && currentUser.role !== 'ADMIN') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
    }

    const user = await userService.updateUserById(requestedUserId, req.body);
    res.send(user);
});

const deleteUser = catchAsyncWithAuth(async (req, res) => {
    const requestedUserId = parseInt(req.params.userId);
    const currentUser = req.user;

    // Check if user is deleting their own account or if they are admin
    if (currentUser.id !== requestedUserId && currentUser.role !== 'ADMIN') {
        throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
    }

    await userService.deleteUserById(requestedUserId);
    res.status(httpStatus.OK).send({});
});

export default {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser
};
