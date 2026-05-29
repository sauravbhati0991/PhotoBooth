"use client";

import { useParams } from "next/navigation";
import NewLayout from "@/components/newLayout";

export default function EditLayoutPage() {
  const params = useParams();
  const id = params.id as string;

  return <NewLayout templateId={id} />;
}
