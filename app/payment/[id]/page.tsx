import PaymentPage from "@/components/paymentPage";
const gridData = [
  { id: 1, title: "8-Grid Layout", price: 20 },
  { id: 2, title: "6-Grid Layout", price: 15 },
  { id: 3, title: "4-Grid Layout", price: 12 },
  { id: 4, title: "3-Grid Layout", price: 10 },
  { id: 5, title: "2-Grid Layout", price: 8 },
  { id: 6, title: "Single Layout", price: 90 },
];

async function Payment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grid = gridData.find((item) => item.id === Number(id));
  if (!grid) {
    return <div>Grid Not Found</div>;
  }
  return (
    <div className="w-full">
      <PaymentPage grid={grid} />
    </div>
  );
}

export default Payment;
