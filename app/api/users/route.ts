import { jsonData, jsonUnexpectedError } from "@/lib/server/responses";
import { listUsers } from "@/lib/server/users";

export async function GET() {
  try {
    return jsonData(await listUsers());
  } catch (error) {
    return jsonUnexpectedError(error, "GET /api/users");
  }
}
