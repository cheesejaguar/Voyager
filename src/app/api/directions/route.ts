import { auth } from "@clerk/nextjs/server";
import { getWalkingDirections } from "@/lib/services/mapbox";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const fromLat = parseFloat(url.searchParams.get("fromLat") ?? "");
  const fromLng = parseFloat(url.searchParams.get("fromLng") ?? "");
  const toLat = parseFloat(url.searchParams.get("toLat") ?? "");
  const toLng = parseFloat(url.searchParams.get("toLng") ?? "");

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const result = await getWalkingDirections(fromLat, fromLng, toLat, toLng);
  if (!result) return Response.json({ error: "Directions not available" }, { status: 404 });

  return Response.json(result);
}
