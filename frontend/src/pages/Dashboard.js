import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const [data, setData] = useState({ tasks: [], stats: { total: 0, pending: 0, completed: 0 } });
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetch = async () => {
            const res = await axios.get('/api/tasks');
            setData(res.data);
        };
        if (user) fetch();
    }, [user]);

    return (
        <div className="dashboard p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Task Management Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white shadow rounded border-t-4 border-blue-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Total</p>
                    <p className="text-3xl font-bold">{data.stats.total}</p>
                </div>
                <div className="p-4 bg-white shadow rounded border-t-4 border-yellow-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Pending</p>
                    <p className="text-3xl font-bold">{data.stats.pending}</p>
                </div>
                <div className="p-4 bg-white shadow rounded border-t-4 border-green-500">
                    <p className="text-sm text-gray-500 font-bold uppercase">Completed</p>
                    <p className="text-3xl font-bold">{data.stats.completed}</p>
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
                        {data.tasks.map(t => (
                            <tr key={t._id} className="border-t text-sm">
                                <td className="p-3">{t.title}</td>
                                <td className="p-3 uppercase font-bold text-xs">{t.status}</td>
                                <td className="p-3">{t.priority}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Dashboard;