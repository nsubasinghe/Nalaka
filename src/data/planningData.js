export const projects = [
  {
    projectcode: 'PRJ001',
    projectname: 'Test Project',
    partner: '00001 - Nuwan',
    projecttype: 'Internal'
  },
  {
    projectcode: 'PRJ002',
    projectname: 'ERP Implementation',
    partner: 'BP0002 - ABC Company',
    projecttype: 'Green Field Implementation'
  }
];

export const projectPhasePlans = {
  PRJ001: [
    {
      id: 1,
      name: 'Preparation',
      startDate: '2026-09-01',
      endDate: '2026-09-13'
    },
    {
      id: 2,
      name: 'Design',
      startDate: '2026-09-14',
      endDate: '2026-10-04'
    },
    {
      id: 3,
      name: 'FRS (High Level Design)',
      startDate: '2026-10-05',
      endDate: '2026-10-18'
    }
  ],

  PRJ002: [
    {
      id: 1,
      name: 'Preparation',
      startDate: '2026-10-01',
      endDate: '2026-10-11'
    },
    {
      id: 2,
      name: 'Design',
      startDate: '2026-10-12',
      endDate: '2026-11-01'
    }
  ]
};

export const employees = [
  {
    id: 'EMP001',
    name: 'Nuwan',
    role: 'Project Manager',
    skill: 'Project Management'
  },
  {
    id: 'EMP002',
    name: 'Kasun',
    role: 'Business Analyst',
    skill: 'Business Analysis'
  },
  {
    id: 'EMP003',
    name: 'Amal',
    role: 'Consultant',
    skill: 'ERP'
  },
  {
    id: 'EMP004',
    name: 'Saman',
    role: 'Developer',
    skill: 'Development'
  }
];

export const resourceAllocations = {
  PRJ001: [
    {
      phaseId: 1,
      weekNumber: 1,
      employeeId: 'EMP001',
      allocationPercentage: 100
    },
    {
      phaseId: 1,
      weekNumber: 2,
      employeeId: 'EMP001',
      allocationPercentage: 50
    },
    {
      phaseId: 1,
      weekNumber: 2,
      employeeId: 'EMP002',
      allocationPercentage: 100
    },
    {
      phaseId: 2,
      weekNumber: 1,
      employeeId: 'EMP002',
      allocationPercentage: 100
    },
    {
      phaseId: 2,
      weekNumber: 2,
      employeeId: 'EMP003',
      allocationPercentage: 75
    },
    {
      phaseId: 2,
      weekNumber: 3,
      employeeId: 'EMP003',
      allocationPercentage: 100
    },
    {
      phaseId: 2,
      weekNumber: 3,
      employeeId: 'EMP004',
      allocationPercentage: 100
    },
    {
      phaseId: 3,
      weekNumber: 1,
      employeeId: 'EMP002',
      allocationPercentage: 50
    },
    {
      phaseId: 3,
      weekNumber: 1,
      employeeId: 'EMP003',
      allocationPercentage: 100
    }
  ],

  PRJ002: [
    {
      phaseId: 1,
      weekNumber: 1,
      employeeId: 'EMP001',
      allocationPercentage: 50
    }
  ]
};

export const standardPhases = [
  { id: 1, name: 'Preparation' },
  { id: 2, name: 'Design' },
  { id: 3, name: 'FRS (High Level Design)' },
  { id: 4, name: 'Detailed Design' },
  { id: 5, name: 'Build' },
  { id: 6, name: 'Configuration' },
  { id: 7, name: 'Migration' },
  { id: 8, name: 'Test' },
  { id: 9, name: 'Test Preparation' },
  { id: 10, name: 'Integration Testing' },
  { id: 11, name: 'Mock' },
  { id: 12, name: 'Test Preparation' },
  { id: 13, name: 'Integration Testing' },
  { id: 14, name: 'Bug Fix' },
  { id: 15, name: 'Final Prep and Go Live' },
  {
    id: 16,
    name: 'End User Solution Showcase and Training'
  },
  {
    id: 17,
    name: 'Go-live Preparation and Cutover'
  },
  {
    id: 18,
    name: 'Post Go Live Support'
  },
  { id: 19, name: 'Hypercare' }
];