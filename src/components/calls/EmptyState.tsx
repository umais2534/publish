import { Phone } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No call recordings found</h3>
      <p className="text-muted-foreground">
        Try adjusting your search or make a new call
      </p>
    </div>
  );
};

export default EmptyState;