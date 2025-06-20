'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/datatable';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import Link from 'next/link';
import { Demo } from '@/types';
import { ChartData, ChartOptions } from 'chart.js';
import { useAuth } from '../../../layout/context/AuthContext';
import { useRouter } from 'next/navigation';

const userHealth = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')

    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    
    // State management
    const [vitalsData, setVitalsData] = useState(null);
    const [vitalsError, setVitalsError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOptions, setUserOptions] = useState([]);
    const [timeSeriesData, setTimeSeriesData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    // Fetch vitals data
    const fetchVitalsData = async (userId = null) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setVitalsError("No access token found.");
            return;
        }

        setLoading(true);
        setVitalsError(null);

        try {
            const url = userId 
                ? `http://localhost:8000/vitals/get-vitals/?user_id=${userId}`
                : 'http://localhost:8000/vitals/get-vitals/';
                
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Vitals data:', data);
            setVitalsData(data);
            
            // Process data for charts
            processChartData(data);
            
            // If all users data, create user options for dropdown
            if (data.type === 'all_users') {
                const options = data.data.map(user => ({
                    label: user.username,
                    value: user.user_id
                }));
                setUserOptions([{ label: 'All Users', value: null }, ...options]);
            }
            
        } catch (error) {
            console.error('Error fetching vitals:', error);
            setVitalsError("Could not load vitals data.");
        } finally {
            setLoading(false);
        }
    };

    // Process data for time series charts
    const processChartData = (data) => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        let chartData = {};
        let options = {};

        if (data.type === 'single_user' && data.data) {
            // Single user time series
            const vitals = data.data;
            const labels = vitals.map(v => new Date(v.timestamp).toLocaleDateString());
            
            chartData = {
                heartRate: {
                    labels: labels,
                    datasets: [{
                        label: 'Heart Rate (BPM)',
                        data: vitals.map(v => v.heart_rate),
                        fill: false,
                        borderColor: documentStyle.getPropertyValue('--red-500'),
                        backgroundColor: documentStyle.getPropertyValue('--red-500'),
                        tension: 0.4
                    }]
                },
                temperature: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperature (°C)',
                        data: vitals.map(v => v.temperature),
                        fill: false,
                        borderColor: documentStyle.getPropertyValue('--orange-500'),
                        backgroundColor: documentStyle.getPropertyValue('--orange-500'),
                        tension: 0.4
                    }]
                },
                oxygenSaturation: {
                    labels: labels,
                    datasets: [{
                        label: 'Oxygen Saturation (%)',
                        data: vitals.map(v => v.oxygen_saturation),
                        fill: false,
                        borderColor: documentStyle.getPropertyValue('--blue-500'),
                        backgroundColor: documentStyle.getPropertyValue('--blue-500'),
                        tension: 0.4
                    }]
                },
                combined: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Heart Rate (BPM)',
                            data: vitals.map(v => v.heart_rate),
                            borderColor: documentStyle.getPropertyValue('--red-500'),
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            yAxisID: 'y'
                        },
                        {
                            label: 'Temperature (°C)',
                            data: vitals.map(v => v.temperature * 20), // Scale for visibility
                            borderColor: documentStyle.getPropertyValue('--orange-500'),
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            yAxisID: 'y1'
                        },
                        {
                            label: 'Oxygen Saturation (%)',
                            data: vitals.map(v => v.oxygen_saturation),
                            borderColor: documentStyle.getPropertyValue('--blue-500'),
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            yAxisID: 'y'
                        }
                    ]
                }
            };
        } else if (data.type === 'all_users' && data.data) {
            // All users summary chart
            const userNames = data.data.map(user => user.username);
            const avgHeartRates = data.data.map(user => {
                const rates = user.vitals.map(v => v.heart_rate);
                return rates.reduce((a, b) => a + b, 0) / rates.length;
            });
            const avgTemperatures = data.data.map(user => {
                const temps = user.vitals.map(v => v.temperature);
                return temps.reduce((a, b) => a + b, 0) / temps.length;
            });
            const avgOxygenSats = data.data.map(user => {
                const sats = user.vitals.map(v => v.oxygen_saturation);
                return sats.reduce((a, b) => a + b, 0) / sats.length;
            });

            chartData = {
                usersOverview: {
                    labels: userNames,
                    datasets: [
                        {
                            label: 'Avg Heart Rate',
                            data: avgHeartRates,
                            backgroundColor: documentStyle.getPropertyValue('--red-500'),
                        },
                        {
                            label: 'Avg Temperature (×20)',
                            data: avgTemperatures.map(t => t * 20),
                            backgroundColor: documentStyle.getPropertyValue('--orange-500'),
                        },
                        {
                            label: 'Avg Oxygen Saturation',
                            data: avgOxygenSats,
                            backgroundColor: documentStyle.getPropertyValue('--blue-500'),
                        }
                    ]
                }
            };
        }

        // Chart options
        options = {
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        };

        setTimeSeriesData(chartData);
        setChartOptions(options);
    };

    // Initial data fetch
    useEffect(() => {
        if (isAuthenticated) {
            fetchVitalsData();
        }
    }, [isAuthenticated]);

    // Handle user selection change
    const onUserChange = (e) => {
        setSelectedUser(e.value);
        fetchVitalsData(e.value);
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    // Render vital signs table
    const renderVitalsTable = () => {
        if (!vitalsData) return null;

        let tableData = [];
        if (vitalsData.type === 'single_user' && vitalsData.data) {
            tableData = vitalsData.data.map(vital => ({
                ...vital,
                username: vitalsData.username
            }));
        } else if (vitalsData.type === 'all_users') {
            tableData = vitalsData.data.flatMap(user => 
                user.vitals.map(vital => ({
                    ...vital,
                    username: user.username
                }))
            );
        }

        return (
            <DataTable value={tableData} paginator rows={10} className="p-datatable-gridlines">
                <Column field="username" header="User" sortable />
                <Column field="timestamp" header="Timestamp" body={(rowData) => formatTimestamp(rowData.timestamp)} sortable />
                <Column field="heart_rate" header="Heart Rate (BPM)" sortable />
                <Column field="blood_pressure" header="Blood Pressure" sortable />
                <Column field="temperature" header="Temperature (°C)" sortable />
                <Column field="oxygen_saturation" header="Oxygen Saturation (%)" sortable />
            </DataTable>
        );
    };


    return (
        <div className="grid">
            <div className="col-12">
                <Card title="Health Vitals Dashboard">
                    {/* User Selection Dropdown */}
                    {userOptions.length > 0 && (
                        <div className="mb-4">
                            <label htmlFor="userSelect" className="block text-900 font-medium mb-2">
                                Select User
                            </label>
                            <Dropdown
                                id="userSelect"
                                value={selectedUser}
                                options={userOptions}
                                onChange={onUserChange}
                                placeholder="Select a user"
                                className="w-full md:w-14rem"
                            />
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {loading && (
                        <div className="text-center mb-4">
                            <ProgressSpinner />
                        </div>
                    )}

                    {/* Error Message */}
                    {vitalsError && (
                        <Message severity="error" text={vitalsError} className="mb-4" />
                    )}

                    {/* Charts Section */}
                    {vitalsData && !loading && (
                        <>
                            {vitalsData.type === 'single_user' && vitalsData.data && (
                                <div className="grid">
                                    <div className="col-12 lg:col-6">
                                        <Card title="Heart Rate Over Time">
                                            <Chart type="line" data={timeSeriesData.heartRate} options={chartOptions} />
                                        </Card>
                                    </div>
                                    <div className="col-12 lg:col-6">
                                        <Card title="Temperature Over Time">
                                            <Chart type="line" data={timeSeriesData.temperature} options={chartOptions} />
                                        </Card>
                                    </div>
                                    <div className="col-12 lg:col-6">
                                        <Card title="Oxygen Saturation Over Time">
                                            <Chart type="line" data={timeSeriesData.oxygenSaturation} options={chartOptions} />
                                        </Card>
                                    </div>
                                    <div className="col-12 lg:col-6">
                                        <Card title="Combined Vitals">
                                            <Chart type="line" data={timeSeriesData.combined} options={{
                                                ...chartOptions,
                                                scales: {
                                                    ...chartOptions.scales,
                                                    y1: {
                                                        ...chartOptions.scales.y1,
                                                        display: true
                                                    }
                                                }
                                            }} />
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {vitalsData.type === 'all_users' && (
                                <div className="col-12">
                                    <Card title="Users Overview - Average Vitals">
                                        <Chart type="bar" data={timeSeriesData.usersOverview} options={chartOptions} />
                                    </Card>
                                </div>
                            )}

                            {/* Data Table */}
                            <div className="col-12 mt-4">
                                <Card title="Vitals Data Table">
                                    {renderVitalsTable()}
                                </Card>
                            </div>
                        </>
                    )}

                    {/* No Data Message */}
                    {vitalsData && vitalsData.message && (
                        <Message severity="info" text={vitalsData.message} className="mb-4" />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default userHealth;