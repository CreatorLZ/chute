import { createQewordlyClient } from "@qewordly/react";

export const API_URL = process.env.QEWORDLY_API_URL!;
export const qw = createQewordlyClient({
  baseUrl: API_URL,
  apiKey: process.env.QEWORDLY_API_KEY!,
});
