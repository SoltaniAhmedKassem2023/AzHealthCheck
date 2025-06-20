/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../layout/context/AuthContext';
import { useRouter } from 'next/navigation';
import ReusableTable from './Tables/page';

const Dashboard = () => {
     const severityColors = {
    HIGH: { bgColor: '#f8d7da', iconColor: '#721c24' },      // red-ish
    MEDIUM: { bgColor: '#fff3cd', iconColor: '#856404' },    // yellow-ish
    LOW: { bgColor: '#d1ecf1', iconColor: '#0c5460' },       // blue-ish
    DEFAULT: { bgColor: '#eee', iconColor: '#333' }
    };
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState(null);
    const [usersError, setUsersError] = useState(null);
    const [stats, setStats] = useState(null);
    const [statsError, setStatsError] = useState(null);
    const wsRef = useRef(null);
      const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const fetchStats = async () => {
            
            if (!token) {
                setStatsError("No access token found.");
                return;
            }

            try {
                const res = await fetch('http://localhost:8000/api/system-stats/', {
                    headers: {
          
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch stats');
                }

                const data = await res.json();
                console.log(data)
                setStats(data);
            } catch (error) {
                console.error(error);
                setStatsError("Could not load system stats.");
            }
        };
       const fetchUsersContact = async () => {
    if (!token) {
        setUsersError("No access token found.");
        return;
    }
    console.log(token)
    try {
        const resUser = await fetch('http://localhost:8000/api/users-contact/', {
            method: 'GET',
        
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  
            }
        });

        if (!resUser.ok) {
            throw new Error('Failed to fetch users');
        }

        const dataUser = await resUser.json();
        console.log(dataUser);
        setUsers(dataUser);
    } catch (error) {
        console.error(error);
        setUsersError("Could not load users.");
    }
};

        fetchUsersContact();
        fetchStats();

    const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsScheme}://localhost:8000/ws/vitals/notifications/`;
   
    // Important: channels AuthMiddlewareStack expects the token as query param 'token'
    // Adjust your Django Channels middleware if needed to accept it this way.
    const socket = new WebSocket(`${wsUrl}?token=${token}`);

    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'vital_notification') {
          // Add new notification to the list
          setNotifications((prev) => [data.data, ...prev]);
        }
        // You can handle other message types here if needed
      } catch (err) {
        console.error('Error parsing WebSocket message', err);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected', event);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

    return (
        <div className="grid">
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Users</span>
                            <div className="text-900 font-medium text-xl">{stats?.users}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                        </div>
                    </div>
                   
                </div>
            </div>
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Active Users</span>
                            <div className="text-900 font-medium text-xl">{stats?.users - 2}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-map-marker text-orange-500 text-xl" />
                        </div>
                    </div>
                  
                </div>
            </div>
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Total Messages</span>
                            <div className="text-900 font-medium text-xl">{stats?.queue_messages}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-inbox text-cyan-500 text-xl" />
                        </div>
                    </div>
          
                </div>
            </div>
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Messages Last Hour</span>
                            <div className="text-900 font-medium text-xl">{stats?.messages_last_hour}</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-comment text-purple-500 text-xl" />
                        </div>
                    </div>

                </div>
            </div>

            <div className="col-12 xl:col-6">
                <div className="card">
                    <h5>Patient Contact</h5>
                <ReusableTable data={users} /> 
                </div>
               
            </div>

            <div className="col-12 xl:col-6">
  <div className="card">
    <div className="flex align-items-center justify-content-between mb-4">
      <h5>Notifications</h5>
    </div>

    {notifications.length === 0 ? (
      <p>No new notifications.</p>
    ) : (
      <ul className="list-none p-0 m-0">
        {notifications.map((notif, index) => {
          const severity = notif.alert?.severity || 'DEFAULT';
          const { bgColor, iconColor } = severityColors[severity] || severityColors.DEFAULT;

          // You can choose an icon based on alert type or severity:
          let icon = 'pi-exclamation-triangle'; // default alert icon
          if (severity === 'HIGH') icon = 'pi-times-circle';
          else if (severity === 'MEDIUM') icon = 'pi-exclamation-triangle';
          else if (severity === 'LOW') icon = 'pi-info-circle';

          // Format timestamp nicely
          const timeString = new Date(notif.timestamp).toLocaleString();

          return (
            <li
              key={index}
              className="flex align-items-center py-2 border-bottom-1 surface-border"
            >
              <div
                className="w-3rem h-3rem flex align-items-center justify-content-center border-circle mr-3 flex-shrink-0"
                style={{ backgroundColor: bgColor }}
              >
                <i className={`pi ${icon} text-xl`} style={{ color: iconColor }} />
              </div>
              <div className="flex flex-column">
                <span className="text-900 line-height-3 font-semibold">{notif.alert?.message || 'No message'}</span>
                <small className="text-600">
                  {notif.username} — {timeString}
                </small>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
</div>

               
            </div>
     
    );
};

export default Dashboard;
