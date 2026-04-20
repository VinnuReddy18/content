import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, repeatType: "mirror" }}
      className={cn("rounded-md bg-[#222224]/50", className)}
      {...props}
    />
  );
}

export { Skeleton };
