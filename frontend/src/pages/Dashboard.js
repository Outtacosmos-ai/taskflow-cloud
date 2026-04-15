// PATH: frontend/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../services/api'; // CHANGED: Import your configured interceptor
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [data, setData] = useState({ tasks: [], stats: { total: 0, pending: 0, completed: 0 } });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // CHANGED: Uses the api service, meaning auth token is automatically attached
                const res = await api.get('/tasks');
                setData(res.data);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="spinner large"></div>
            </div>
        );
    }

    return (
        <div className="dashboard p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Task Management Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white shadow rounded border-t-4 border-blue-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Total</p>
                    <p className="text-3xl font-bold">{data.stats?.total || 0}</p>
                </div>
                <div className="p-4 bg-white shadow rounded border-t-4 border-yellow-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Pending</p>
                    <p className="text-3xl font-bold">{data.stats?.pending || 0}</p>
                </div>
                <div className="p-4 bg-white shadow rounded border-t-4 border-green-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Completed</p>
                    <p className="text-3xl font-bold">{data.stats?.completed || 0}</p>
                </div>
            </div>
            <div className="bg-white shadow rounded overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 uppercase text-xs">
                        <tr>
                            <th className="p-3">Task Title</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.tasks?.map(t => (
                            <tr key={t._id} className="border-t text-sm">
                                <td className="p-3">{t.title}</td>
                                <td className="p-3 uppercase font-bold text-xs">{t.status}</td>
                                <td className="p-3">{t.priority}</td>
                            </tr>
                        ))}
                        {data.tasks?.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-4 text-center text-gray-500">No tasks found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Dashboard;