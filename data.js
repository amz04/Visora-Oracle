const MACHINES = [
  {
    id: 1,
    name: "CNC Milling Machine",
    type: "CNC",
    department: "Manufacturing A",
    location: "Bay 3",
    status: "operational",
    lastServiced: "April 10, 2025",
    lastServicedAgo: "4d ago",
    avgDowntime: "2.3 hrs",
    sessionsCount: 4,
    videosCount: 1,
    image: "thumbnails/machine1.jpg",
    sessions: [
      {
        id: "s1-1",
        title: "Hydraulic Seal Replacement",
        date: "April 13, 2025",
        dateShort: "Apr 13",
        technician: "Ahmed Al Mansoori",
        severity: "critical",
        trigger: "Machine breakdown — unexpected failure during operation",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "3 hours 20 minutes",
        summary: "The hydraulic seal on the primary pump housing failed during the morning shift. Ahmed performed a full seal replacement including pressure testing and system flush before returning the machine to service.",
        steps: [
          "Powered down and locked out machine",
          "Released hydraulic pressure",
          "Removed access panel (left side)",
          "Replaced seal housing unit",
          "Pressure tested at 4.1 kN",
          "Powered on and verified operation"
        ],
        timestamps: [
          { time: 0, label: "Machine powered down and locked out" },
          { time: 105, label: "Access panel removed, seal housing exposed" },
          { time: 200, label: "Old seal removed, new seal pressed in evenly" },
          { time: 310, label: "Pressure tested and machine powered on" }
        ],
        tools: ["12mm Wrench", "Snap Ring Pliers", "Torque Wrench", "Pressure Gauge"],
        parts: ["Hydraulic Seal — Part #HS-441", "Retaining Ring — Part #RR-209"],
        videoId: "v1-1",
        month: "APRIL 2025"
      },
      {
        id: "s1-2",
        title: "Routine Inspection & Lubrication",
        date: "April 3, 2025",
        dateShort: "Apr 3",
        technician: "Sara Mohammed",
        severity: "routine",
        trigger: "Scheduled monthly inspection",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "45 minutes",
        summary: "Monthly inspection covering all moving parts, lubrication of key components, and calibration check. No faults found.",
        steps: [
          "Visual inspection of all moving parts",
          "Lubricate spindle bearings",
          "Check coolant levels",
          "Calibration test",
          "Sign off"
        ],
        timestamps: [
          { time: 0, label: "Visual inspection begins" },
          { time: 70, label: "Spindle bearing lubrication" },
          { time: 150, label: "Coolant level check" },
          { time: 225, label: "Calibration test and sign off" }
        ],
        tools: ["Grease Gun", "Calibration Tool", "Inspection Checklist"],
        parts: [],
        videoId: null,
        month: "APRIL 2025"
      },
      {
        id: "s1-3",
        title: "Spindle Bearing Replacement",
        date: "March 21, 2025",
        dateShort: "Mar 21",
        technician: "Ahmed Al Mansoori",
        severity: "warning",
        trigger: "Unusual vibration detected during operation",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "5 hours",
        summary: "Excessive vibration in the spindle assembly led to early bearing replacement. Full disassembly and reassembly performed with new SKF bearings.",
        steps: [
          "Diagnose vibration source",
          "Power down and lockout",
          "Remove spindle assembly",
          "Replace bearings",
          "Reassemble",
          "Test run"
        ],
        timestamps: [
          { time: 0, label: "Vibration diagnosis" },
          { time: 130, label: "Spindle assembly removed" },
          { time: 240, label: "Old bearings extracted" },
          { time: 390, label: "New bearings installed" },
          { time: 495, label: "Reassembly and test run" }
        ],
        tools: ["Bearing Puller", "Torque Wrench", "Rubber Mallet", "Dial Indicator"],
        parts: ["SKF Spindle Bearing #SB-7710 (x2)"],
        videoId: null,
        month: "MARCH 2025"
      },
      {
        id: "s1-4",
        title: "Coolant System Flush",
        date: "March 5, 2025",
        dateShort: "Mar 5",
        technician: "Khalid Hassan",
        severity: "routine",
        trigger: "Scheduled quarterly maintenance",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "1 hour 10 minutes",
        summary: "Full coolant system flush and refill as part of quarterly maintenance schedule. Coolant filter also replaced.",
        steps: [
          "Drain old coolant",
          "Flush system with water",
          "Refill with fresh coolant",
          "Replace filter",
          "Test flow"
        ],
        timestamps: [
          { time: 0, label: "Coolant drain begins" },
          { time: 60, label: "System flush" },
          { time: 140, label: "Fresh coolant refill" },
          { time: 210, label: "Filter replacement and flow test" }
        ],
        tools: ["Drain Pan", "Funnel", "Filter Wrench"],
        parts: ["Coolant Filter #CF-330", "Coolant Mix (10L)"],
        videoId: null,
        month: "MARCH 2025"
      }
    ],
    videos: [
      {
        id: "v1-1",
        title: "Hydraulic Seal Replacement",
        technician: "Ahmed Al Mansoori",
        date: "March 3, 2025",
        dateShort: "Mar 3",
        duration: "6:24",
        durationSecs: 384,
        severity: "critical",
        file: "videos/cnc-milling.mp4",
        thumb: "thumbnails/thumb1.jpg",
        sessionId: "s1-1",
        month: "APRIL 2025"
      }
    ],
    chat: []
  },
  {
    id: 2,
    name: "Conveyor Belt System",
    type: "Conveyor",
    department: "Assembly Line B",
    location: "Line 4",
    status: "maintenance",
    lastServiced: "April 13, 2025",
    lastServicedAgo: "1d ago",
    avgDowntime: "1.8 hrs",
    sessionsCount: 3,
    videosCount: 2,
    image: "thumbnails/machine2.jpg",
    sessions: [
      {
        id: "s2-1",
        title: "Drive Belt Tension Adjustment",
        date: "April 13, 2025",
        dateShort: "Apr 13",
        technician: "Sara Mohammed",
        severity: "warning",
        trigger: "Belt slipping detected during operation",
        outcome: "Ongoing — machine under observation",
        outcomeStatus: "ongoing",
        downtime: "2 hours",
        summary: "Belt slipping caused by reduced tension on the primary drive side. Tension adjusted to 3.9 kN. Machine returned to service but placed under monitoring for 48 hours.",
        steps: [
          "Stop conveyor",
          "Measure current tension",
          "Adjust tensioning bolts",
          "Re-measure tension",
          "Test run",
          "Log and monitor"
        ],
        timestamps: [
          { time: 0, label: "Conveyor stopped, tension measured" },
          { time: 45, label: "Tensioning bolts adjusted" },
          { time: 90, label: "Tension re-measured at 3.9 kN" },
          { time: 165, label: "Test run and monitoring setup" }
        ],
        tools: ["Tension Meter", "16mm Wrench", "Measuring Tape"],
        parts: [],
        videoId: "v2-1",
        month: "APRIL 2025"
      },
      {
        id: "s2-2",
        title: "Drive Pulley Inspection",
        date: "April 1, 2025",
        dateShort: "Apr 1",
        technician: "Khalid Hassan",
        severity: "routine",
        trigger: "Scheduled inspection",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "30 minutes",
        summary: "Routine inspection of the drive pulley surface. Minor glazing detected and addressed with surface treatment. Belt alignment also verified.",
        steps: [
          "Stop conveyor",
          "Inspect pulley surface",
          "Apply surface treatment",
          "Check belt alignment",
          "Restart"
        ],
        timestamps: [
          { time: 0, label: "Conveyor stopped, pulley inspection" },
          { time: 30, label: "Surface treatment applied" },
          { time: 75, label: "Belt alignment verified" },
          { time: 120, label: "Conveyor restarted" }
        ],
        tools: ["Surface Treatment Kit", "Alignment Ruler"],
        parts: [],
        videoId: "v2-2",
        month: "APRIL 2025"
      },
      {
        id: "s2-3",
        title: "Emergency Stop System Test",
        date: "March 15, 2025",
        dateShort: "Mar 15",
        technician: "Ahmed Al Mansoori",
        severity: "routine",
        trigger: "Monthly safety compliance check",
        outcome: "Resolved",
        outcomeStatus: "resolved",
        downtime: "20 minutes",
        summary: "All emergency stop buttons tested along the conveyor line. Response times verified to be within the required 0.3 second threshold. All clear.",
        steps: [
          "Test each E-stop button",
          "Verify response time",
          "Document results",
          "Sign off"
        ],
        timestamps: [
          { time: 0, label: "E-stop testing begins" },
          { time: 60, label: "Response times verified" },
          { time: 130, label: "Documentation and sign off" }
        ],
        tools: ["Stopwatch", "Safety Checklist"],
        parts: [],
        videoId: null,
        month: "MARCH 2025"
      }
    ],
    videos: [
      {
        id: "v2-1",
        title: "Drive Belt Tension Adjustment",
        technician: "Sara Mohammed",
        date: "April 13, 2025",
        dateShort: "Apr 13",
        duration: "3:15",
        durationSecs: 195,
        severity: "warning",
        file: "videos/video4.mp4",
        thumb: "thumbnails/thumb4.jpg",
        sessionId: "s2-1",
        month: "APRIL 2025"
      },
      {
        id: "v2-2",
        title: "Drive Pulley Inspection",
        technician: "Khalid Hassan",
        date: "April 1, 2025",
        dateShort: "Apr 1",
        duration: "2:50",
        durationSecs: 170,
        severity: "routine",
        file: "videos/video5.mp4",
        thumb: "thumbnails/thumb5.jpg",
        sessionId: "s2-2",
        month: "APRIL 2025"
      }
    ],
    chat: []
  },
  {
    id: 3,
    name: "Hydraulic Press Unit",
    type: "Hydraulic",
    department: "Manufacturing B",
    location: "Bay 7",
    status: "operational",
    lastServiced: "April 7, 2025",
    lastServicedAgo: "7d ago",
    avgDowntime: "1.5 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine3.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 4,
    name: "Robotic Welding Arm",
    type: "Robotics",
    department: "Assembly Line A",
    location: "Station 2",
    status: "operational",
    lastServiced: "April 1, 2025",
    lastServicedAgo: "13d ago",
    avgDowntime: "0.8 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine4.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 5,
    name: "Industrial Air Compressor",
    type: "Pneumatic",
    department: "Utilities",
    location: "Utility Room",
    status: "out-of-service",
    lastServiced: "February 14, 2025",
    lastServicedAgo: "59d ago",
    avgDowntime: "4.2 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine5.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 6,
    name: "Laser Cutting Machine",
    type: "Laser",
    department: "Fabrication",
    location: "Fab Bay 1",
    status: "operational",
    lastServiced: "April 5, 2025",
    lastServicedAgo: "9d ago",
    avgDowntime: "1.1 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine1.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 7,
    name: "CNC Lathe Machine",
    type: "CNC",
    department: "Manufacturing B",
    location: "Bay 5",
    status: "operational",
    lastServiced: "March 15, 2025",
    lastServicedAgo: "30d ago",
    avgDowntime: "1.9 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine2.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 8,
    name: "Overhead Crane System",
    type: "Crane",
    department: "Warehouse",
    location: "Warehouse A",
    status: "maintenance",
    lastServiced: "April 11, 2025",
    lastServicedAgo: "3d ago",
    avgDowntime: "3.0 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine3.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 9,
    name: "Injection Molding Press",
    type: "Molding",
    department: "Production",
    location: "Prod Bay 2",
    status: "operational",
    lastServiced: "March 20, 2025",
    lastServicedAgo: "25d ago",
    avgDowntime: "2.1 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine4.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 10,
    name: "Industrial Generator Unit",
    type: "Power",
    department: "Utilities",
    location: "Generator Room",
    status: "operational",
    lastServiced: "April 8, 2025",
    lastServicedAgo: "6d ago",
    avgDowntime: "0.5 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine5.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 11,
    name: "Pneumatic Drilling Rig",
    type: "Drilling",
    department: "Fabrication",
    location: "Fab Bay 3",
    status: "operational",
    lastServiced: "March 10, 2025",
    lastServicedAgo: "35d ago",
    avgDowntime: "1.4 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine1.jpg",
    sessions: [],
    videos: [],
    chat: []
  },
  {
    id: 12,
    name: "Automated Painting System",
    type: "Painting",
    department: "Finishing",
    location: "Finish Line",
    status: "out-of-service",
    lastServiced: "January 30, 2025",
    lastServicedAgo: "74d ago",
    avgDowntime: "5.5 hrs",
    sessionsCount: 0,
    videosCount: 0,
    image: "thumbnails/machine2.jpg",
    sessions: [],
    videos: [],
    chat: []
  }
];

function getMachineById(id) {
  return MACHINES.find(m => m.id === id) || null;
}

function getStatusLabel(status) {
  const map = { operational: "Operational", maintenance: "Under Maintenance", "out-of-service": "Out of Service" };
  return map[status] || status;
}

function getStatusClass(status) {
  const map = { operational: "green", maintenance: "yellow", "out-of-service": "red" };
  return map[status] || "green";
}

function getStatusColor(status) {
  const map = { operational: "#22C55E", maintenance: "#F59E0B", "out-of-service": "#EF4444" };
  return map[status] || "#22C55E";
}

function getSeverityLabel(severity) {
  const map = { critical: "CRITICAL", warning: "WARNING", routine: "ROUTINE" };
  return map[severity] || severity.toUpperCase();
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
