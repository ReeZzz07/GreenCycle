export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: {
    id: number;
    name: string;
  };
}

export interface AuthResponse {
  data: TokenPairDto;
}
