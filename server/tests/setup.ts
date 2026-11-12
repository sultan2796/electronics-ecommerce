process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.JWT_ACCESS_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.CLIENT_URL ??= "http://localhost:5173";
process.env.PAYMENT_PROVIDER ??= "mock";
process.env.EMAIL_PROVIDER ??= "console";
process.env.EPOINT_PUBLIC_KEY ??= "i000000001";
process.env.EPOINT_PRIVATE_KEY ??= "test-private-key";
