import Link from "next/link";
import GridCard from "./gridCard";

interface GridItem {
  id: number;
  title: string;
  price: number;
  image: string;
}

const gridData: GridItem[] = [
  {
    id: 1,
    title: "8-Grid Layout",
    price: 20.0,
    image: "/8-grid.png",
  },
  {
    id: 2,
    title: "6-Grid Layout",
    price: 15.0,
    image: "/6-grid.png",
  },
  {
    id: 3,
    title: "4-Grid Layout",
    price: 12.0,
    image: "/4-grid.png",
  },
  {
    id: 4,
    title: "3-Grid Layout",
    price: 10.0,
    image: "/3-grid.png",
  },
  {
    id: 5,
    title: "2-Grid Layout",
    price: 8.0,
    image: "/2-grid.png",
  },
  {
    id: 6,
    title: "Single Layout",
    price: 90.0,
    image: "/1-grid.png",
  },
];

const GridCardsSection = () => {
  return (
    <>
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <Link
          href={"/"}
          className="text-2xl font-bold text-blue-400 underline decoration-brand hover:cursor-pointer"
        >
          PhotoBooth
        </Link>
      </nav>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 ">
          Choose Your Photo Grid Layout
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {gridData.map((item) => (
            <GridCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default GridCardsSection;
