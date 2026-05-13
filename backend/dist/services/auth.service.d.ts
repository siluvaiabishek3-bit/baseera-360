/**
 * BASEERA 360 - Authentication Service
 * Handles user registration, login, and JWT token generation
 */
interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId?: string;
    isActive: boolean;
    createdAt: Date;
}
interface LoginResponse {
    user: User;
    token: string;
}
interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: string;
}
export declare class AuthService {
    /**
     * Register a new user
     */
    register(data: RegisterData): Promise<LoginResponse>;
    /**
     * Login user
     */
    login(email: string, password: string): Promise<LoginResponse>;
    /**
     * Generate JWT token
     */
    private generateToken;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): any;
    /**
     * Get user by ID
     */
    getUserById(userId: string): Promise<User>;
    /**
     * Refresh JWT token
     */
    refreshToken(userId: string): string;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map