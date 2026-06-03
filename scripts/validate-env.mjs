const requiredVariables = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];

const optionalUrlVariables = ["AUTH_URL", "S3_PUBLIC_BASE_URL"];
const errors = [];

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateUrl(name, value, { protocols } = {}) {
  try {
    const url = new URL(value);

    if (protocols && !protocols.includes(url.protocol)) {
      errors.push(`${name} must use one of: ${protocols.join(", ")}`);
    }
  } catch {
    errors.push(`${name} must be a valid URL`);
  }
}

for (const name of requiredVariables) {
  if (!isPresent(process.env[name])) {
    errors.push(`${name} is required`);
  }
}

if (isPresent(process.env.DATABASE_URL)) {
  validateUrl("DATABASE_URL", process.env.DATABASE_URL, {
    protocols: ["postgresql:", "postgres:"],
  });
}

if (isPresent(process.env.AUTH_SECRET) && process.env.AUTH_SECRET.length < 32) {
  errors.push("AUTH_SECRET must be at least 32 characters");
}

if (isPresent(process.env.S3_ENDPOINT)) {
  validateUrl("S3_ENDPOINT", process.env.S3_ENDPOINT);
}

for (const name of optionalUrlVariables) {
  if (isPresent(process.env[name])) {
    validateUrl(name, process.env[name]);
  }
}

if (
  isPresent(process.env.S3_FORCE_PATH_STYLE) &&
  !["true", "false"].includes(process.env.S3_FORCE_PATH_STYLE)
) {
  errors.push("S3_FORCE_PATH_STYLE must be true or false");
}

if (isPresent(process.env.PORT)) {
  const port = Number(process.env.PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("PORT must be an integer from 1 to 65535");
  }
}

if (errors.length > 0) {
  console.error("Invalid environment configuration:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log("Environment configuration is valid.");
