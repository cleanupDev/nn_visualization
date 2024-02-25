import LayerControllCard from "@/components/sidecards/LayerControllCard";
import LayerInfoCard from "@/components/sidecards/LayerInfoCard";
import LinksInfo from "@/components/linksInfo/LinksInfo";
import ControlPanel from "@/components/controllPanel/ControllPanel";
import ModelDisplay from "@/components/modelDisplay/ModelDisplay";

export default function Home() {
  return (
    <main className="bg-[#ffffff]" style={{ height: "100vh" }}>
      <div className="grid grid-cols-5 gap-2" style={{ height: "100%" }}>
        <div className="col-span-4">
          <div className="grid grid-cols-4">
            <div className="col-span-2 col-start-2 col-end-4">
              <ControlPanel />
            </div>
          </div>
          <div className="col-span-4 bg-slate-500 h-full">
            <ModelDisplay />
          </div>
        </div>

        <div className="grid grid-rows-13 grid-flow-col mr-2 mt-2">
          <div className="row-start-1 row-end-6">
            <LayerControllCard />
          </div>
          <div className="row-start-7 row-end-12">
            <LayerInfoCard />
          </div>
          <div className="row-start-13 row-end-13">
            <LinksInfo />
          </div>
        </div>
      </div>
    </main>
  );
}
