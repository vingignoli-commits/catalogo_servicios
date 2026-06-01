export const dynamic = "force-dynamic";

import { getAvailableSlots } from "@/lib/availability/slots";

export default async function TestSlotsPage() {
  const slots = await getAvailableSlots({
    professionalId: "0b01ad32-089f-411b-855d-24f48d782cb0",
    serviceId: "4d56b4f5-00ff-48a2-8e0b-f29c9e110c8d",
    date: new Date(),
  });

  return (
    <pre className="p-6 text-white bg-black min-h-screen">
      {JSON.stringify(slots, null, 2)}
    </pre>
  );
}


