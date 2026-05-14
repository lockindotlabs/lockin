import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";

// Mock interface for demonstration
interface User {
    id: string;
    name: string;
    email: string;
}

export class UserController extends BaseController {
    // Mock database
    private users: User[] = [
        { id: "1", name: "Alice", email: "alice@example.com" },
        { id: "2", name: "Bob", email: "bob@example.com" }
    ];

    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            this.handleSuccess(res, this.users);
        } catch (error) {
            this.handleError(error, res, "getAllUsers");
        }
    }

    async getUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user = this.users.find(u => u.id === id);

            if (!user) {
                return this.handleError(new Error("User not found"), res, "getUser", 404);
            }

            this.handleSuccess(res, user);
        } catch (error) {
            this.handleError(error, res, "getUser");
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { name, email } = req.body;
            
            if (!name || !email) {
                return this.handleError(new Error("Missing required fields"), res, "createUser", 400);
            }

            const newUser: User = {
                id: (this.users.length + 1).toString(),
                name,
                email
            };

            this.users.push(newUser);

            this.handleSuccess(res, newUser, "User created successfully", 201);
        } catch (error) {
            this.handleError(error, res, "createUser");
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const index = this.users.findIndex(u => u.id === id);

            if (index === -1) {
                return this.handleError(new Error("User not found"), res, "deleteUser", 404);
            }

            this.users.splice(index, 1);

            this.handleSuccess(res, null, "User deleted successfully", 204);
        } catch (error) {
            this.handleError(error, res, "deleteUser");
        }
    }
}
