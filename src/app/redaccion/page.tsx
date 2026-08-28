import type { Metadata } from "next";

import { ClassifierDesk } from "@/components/landing/ClassifierDesk";

export const metadata: Metadata = {
  title: "Mesa de redacción",
  description:
    "Pegue un texto político y el clasificador repartirá su encuadre entre las ocho clases ideológicas.",
};

export default function ClassifierRoute() {
  return <ClassifierDesk standalone />;
}
