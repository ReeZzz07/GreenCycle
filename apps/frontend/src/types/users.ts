export interface User {
  id: number;
  email: string;
  fullName: string;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  roleName: 'super_admin' | 'admin' | 'manager' | 'accountant' | 'logistic';
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  roleName?: 'super_admin' | 'admin' | 'manager' | 'accountant' | 'logistic';
}

