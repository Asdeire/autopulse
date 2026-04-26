import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";

type AuthInput = {
  email: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: {
    id: number;
    email: string;
  };
};

const SALT_ROUNDS = 10;

function invalidCredentialsError(): Error & { statusCode?: number } {
  const error = new Error("Invalid email or password") as Error & { statusCode?: number };
  error.statusCode = 401;
  return error;
}

export async function registerUser(fastify: FastifyInstance, input: AuthInput): Promise<AuthResponse> {
  const existingUser = await fastify.prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    const error = new Error("Email is already in use") as Error & { statusCode?: number };
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await fastify.prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash
    },
    select: {
      id: true,
      email: true
    }
  });

  const token = fastify.jwt.sign({
    userId: user.id,
    email: user.email
  });

  return { token, user };
}

export async function loginUser(fastify: FastifyInstance, input: AuthInput): Promise<AuthResponse> {
  const user = await fastify.prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw invalidCredentialsError();
  }

  const isValidPassword = await bcrypt.compare(input.password, user.password);

  if (!isValidPassword) {
    throw invalidCredentialsError();
  }

  const token = fastify.jwt.sign({
    userId: user.id,
    email: user.email
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email
    }
  };
}
