import {ReactNode} from "react";
import {cn} from "@/lib/utils";

type Props = {
    className? : string;
    children : ReactNode
}
const MaxWidthWrapper = ({className, children} : Props) => {
    return (
        // cn performs merging classNames
        <div className={cn("h-full mx-auto w-full max-w-screen-xl px:2.5 md:px-20", className)}>
            {children}
        </div>

    );
}

export default MaxWidthWrapper;