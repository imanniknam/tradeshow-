import { getBalances } from "@/lib/server/balances";
import { jsonData, jsonUnexpectedError } from "@/lib/server/responses";

export async function GET() {
  try {
    return jsonData(await getBalances());
  } catch (error) {
    return jsonUnexpectedError(error, "GET /api/balances");
  }
}
