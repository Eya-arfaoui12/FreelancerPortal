import Chart from "react-apexcharts";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../../icons";

export default function ProjectsChart() {
  const { fetchAPI } = useAuth();
  const [chartData, setChartData] = useState({
    active: Array(12).fill(0),
    completed: Array(12).fill(0),
    pending: Array(12).fill(0)
  });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchMonthlyProjects = async () => {
      try {
        const response = await fetchAPI('/dashboard/monthly-projects');
        if (response.success) {
          setChartData(response.data);
        }
      } catch (error) {
        console.error('Error fetching monthly projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyProjects();
  }, [fetchAPI]);

  const options = {
    colors: ["#465fff", "#4caf50", "#ff9800"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 320,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: "14px",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val) => `${val} projects`,
      },
    },
  };

  const series = [
    {
      name: "Active Projects",
      data: chartData.active,
    },
    {
      name: "Completed Projects",
      data: chartData.completed,
    },
    {
      name: "Pending Projects",
      data: chartData.pending,
    },
  ];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 dark:bg-gray-700"></div>
        <div className="h-80 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Projects Status
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={320} />
        </div>
      </div>
    </div>
  );
}