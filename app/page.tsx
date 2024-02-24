import LayerControllCard from "@/components/sidecards/LayerControllCard";
import LayerInfoCard from "@/components/sidecards/LayerInfoCard";

export default function Home() {
  return (
    <main className="bg-[#ffffff]" style={{ height: "100vh" }}>
      <div className="grid grid-cols-5 gap-2" style={{ height: "100%" }}>
        <div>Input Layer</div>
        <div className="col-span-2">
          <div>Controll Panel</div>
          <div className="grid grid-cols-3 gap-2">
            <div>Hidden 1</div>
            <div>Hidden 2</div>
            <div>Hidden 3</div>
          </div>
        </div>

        <div>Output Layer</div>
        <div className="grid grid-rows-13 grid-flow-col mr-2">
          <div className="row-start-1 row-end-3 h-full max-h-full overflow-auto">
            <LayerControllCard />
          </div>
          <div className="row-start-4 row-end-12">
            <LayerInfoCard />
          </div>
          <div className="row-start-13 row-end-13">Info | Links</div>
        </div>
      </div>
    </main>
  );
}
