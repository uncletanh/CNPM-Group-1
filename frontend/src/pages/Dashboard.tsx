import { useEffect, useState } from "react";
import api from "../services/api";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    // Mock data khi Backend chưa có API
    setWorkspaces([
      { id: 1, name: "Workspace Demo 1" },
      { id: 2, name: "Workspace Demo 2" }
    ]);

    // TODO: Mở comment dòng này khi backend hoàn thành API /workspaces
    // api.get('/workspaces').then(res => setWorkspaces(res.data));
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">NovaChat AI</h2>
        <ul>
          <li className="py-2 hover:text-gray-300 cursor-pointer">Dashboard</li>
          <li className="py-2 hover:text-gray-300 cursor-pointer">Workspaces</li>
        </ul>
      </div>
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Quản lý Workspaces</h1>
        <div className="grid gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{ws.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
