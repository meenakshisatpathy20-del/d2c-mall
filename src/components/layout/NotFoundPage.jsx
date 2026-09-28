import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Empty, useDocumentTitle } from "../common/ui";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="page container">
      <Empty
        icon={<Compass size={34} />}
        title="This page took a wrong turn"
        text="The page you're looking for doesn't exist or has moved. Let's get you back to shopping."
        action={
          <div className="row gap-6">
            <Link to="/" className="btn">
              Go home
            </Link>
            <Link to="/shop" className="btn btn-outline">
              Browse products
            </Link>
          </div>
        }
      />
    </div>
  );
}
