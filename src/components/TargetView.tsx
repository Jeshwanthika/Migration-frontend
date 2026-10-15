import type { Manifest, PackageInfo } from "../types";
import GeneratedView from "./GeneratedView";
import PackageView from "./PackageView";

/** Generated app summary and the downloadable package on one page. Either part shows as soon as it exists. */
export default function TargetView({ manifest, pkg, runId }: { manifest: Manifest | null; pkg: PackageInfo | null; runId: string }) {
  return (
    <>
      {manifest && <GeneratedView data={manifest} />}
      {pkg && <PackageView info={pkg} runId={runId} />}
    </>
  );
}
