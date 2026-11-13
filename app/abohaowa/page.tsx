import { getDB } from "@/lib/db";
import WeatherClient from "@/components/WeatherClient";

export const dynamic = "force-dynamic";

export default async function Abohaowa() {
  const { advisories } = await getDB();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">⛅ আবহাওয়া ও কৃষি পরামর্শ</h1>
      <WeatherClient advisories={advisories.filter((a) => a.active)} />
    </div>
  );
}
