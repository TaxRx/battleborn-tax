// Report Generator Helper Functions for Clinical Practice Guideline Report

export interface ReportData {
  businessProfile: any;
  selectedActivities: any[];
  selectedSteps: any[];
  selectedSubcomponents: any[];
}

export const generateTableOfContents = (activitiesMap: Map<string, any>): string => {
  return `
    <nav class="toc-sidebar">
      <h2 class="toc-title">📋 Table of Contents</h2>
      
      <div class="toc-section">
        <div class="toc-section-title">Overview</div>
        <a href="#executive-summary" class="toc-item">Executive Summary</a>
        <a href="#business-profile" class="toc-item">Business Profile</a>
        <a href="#research-overview" class="toc-item">Research Overview</a>
      </div>

      <div class="toc-section">
        <div class="toc-section-title">Research Activities</div>
        ${Array.from(activitiesMap.entries()).map(([activityId, data], index) => `
          <a href="#activity-${activityId}" class="toc-item">
            ${index + 1}. ${data.activity.activity?.title || 'Research Activity'}
          </a>
          ${data.steps.map((step: any) => `
            <a href="#step-${step.id}" class="toc-item toc-sub-item">
              ${step.step?.name || 'Research Step'}
            </a>
          `).join('')}
        `).join('')}
      </div>

      <div class="toc-section">
        <div class="toc-section-title">Appendices</div>
        <a href="#compliance-summary" class="toc-item">Compliance Summary</a>
        <a href="#documentation-checklist" class="toc-item">Documentation Checklist</a>
      </div>
    </nav>
  `;
};

export const generateExecutiveSummary = (data: ReportData): string => {
  const { businessProfile, selectedActivities, selectedSteps, selectedSubcomponents } = data;
  
  return `
    <section id="executive-summary" class="report-section executive-summary">
      <div class="section-header">
        <div class="section-icon">📊</div>
        <div>
          <h2 class="section-title">Executive Summary</h2>
          <p class="section-subtitle">Research & Development Clinical Practice Guidelines</p>
        </div>
      </div>

      <div class="direct-research-advisors">
        <div class="dra-logo-section">
          <div class="dra-logo">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <path d="M15 15L45 45M45 15L15 45" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>
              <circle cx="30" cy="30" r="25" stroke="#3B82F6" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <div class="dra-info">
            <h3>Direct Research Advisors</h3>
            <p>This report has been prepared with assistance from Direct Research Advisors, 
            specialists in R&D tax credit documentation and compliance. Our team ensures 
            that all research activities are properly documented according to IRS guidelines 
            and industry best practices.</p>
          </div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-value">${selectedActivities.length}</div>
          <div class="summary-card-label">Research Activities</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-value">${selectedSteps.length}</div>
          <div class="summary-card-label">Research Steps</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-value">${selectedSubcomponents.length}</div>
          <div class="summary-card-label">Subcomponents</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-value">${businessProfile.start_year}</div>
          <div class="summary-card-label">Established</div>
        </div>
      </div>

      <div class="executive-content">
        <p>This comprehensive report documents the qualified research activities undertaken by <strong>${businessProfile.name}</strong> 
        in accordance with clinical practice guidelines and IRC Section 41 requirements for the Research & Development Tax Credit. 
        The research activities documented herein demonstrate systematic experimentation aimed at discovering technological information 
        to develop new or improved business components.</p>

        <div class="key-findings">
          <h3>Key Findings</h3>
          <ul class="guideline-list">
            <li>All research activities meet the four-part test requirements</li>
            <li>Documentation supports technological uncertainty resolution</li>
            <li>Systematic experimentation processes are clearly defined</li>
            <li>Qualified research expenses are properly allocated</li>
            <li>Clinical practice guidelines are followed throughout</li>
          </ul>
        </div>

        <div class="methodology-section">
          <h3>Methodology</h3>
          <p>This report follows established clinical practice guidelines for documenting research activities. 
          Each research component has been evaluated against IRS criteria and industry standards to ensure 
          proper qualification for R&D tax credit purposes.</p>
        </div>
      </div>
    </section>
  `;
};

export const generateBusinessProfile = (businessProfile: any): string => {
  const contactInfo = businessProfile.contact_info || {};
  const formattedAddress = [
    contactInfo.address,
    contactInfo.city,
    contactInfo.state,
    contactInfo.zip
  ].filter(Boolean).join(', ');

  return `
    <section id="business-profile" class="report-section">
      <div class="section-header">
        <div class="section-icon">🏢</div>
        <div>
          <h2 class="section-title">Business Profile</h2>
          <p class="section-subtitle">Company Information & Contact Details</p>
        </div>
      </div>

      <div class="business-profile-content">
        <div class="profile-grid">
          <div class="profile-item">
            <label>Company Name</label>
            <p>${businessProfile.name}</p>
          </div>
          <div class="profile-item">
            <label>Entity Type</label>
            <p>${businessProfile.entity_type}</p>
          </div>
          <div class="profile-item">
            <label>State of Domicile</label>
            <p>${businessProfile.domicile_state}</p>
          </div>
          <div class="profile-item">
            <label>Year Established</label>
            <p>${businessProfile.start_year}</p>
          </div>
        </div>

        <div class="contact-info">
          <h3>Contact Information</h3>
          <div class="contact-grid">
            ${formattedAddress ? `
              <div class="contact-item">
                <label>Address</label>
                <p>${formattedAddress}</p>
              </div>
            ` : ''}
            ${contactInfo.phone ? `
              <div class="contact-item">
                <label>Phone</label>
                <p>${contactInfo.phone}</p>
              </div>
            ` : ''}
            ${contactInfo.email ? `
              <div class="contact-item">
                <label>Email</label>
                <p>${contactInfo.email}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
};

export const generateActivitySection = (
  activityId: string,
  data: any,
  activityIndex: number
): string => {
  const { activity, steps, subcomponents } = data;
  const activityTitle = activity.activity?.title || `Research Activity ${activityIndex + 1}`;

  return `
    <section id="activity-${activityId}" class="report-section">
      <div class="section-header">
        <div class="section-icon">${activityIndex + 1}</div>
        <div>
          <h2 class="section-title">${activityTitle}</h2>
          <p class="section-subtitle">Research Activity Details & Clinical Guidelines</p>
        </div>
      </div>

      <div class="activity-overview">
        <div class="chip chip-primary">Practice Allocation: ${activity.practice_percent}%</div>
        <div class="chip chip-info">${steps.length} Research Steps</div>
        <div class="chip chip-success">${subcomponents.length} Subcomponents</div>
      </div>

      ${generateHierarchyTree(activityTitle, activity, steps, subcomponents)}
      ${generateStepsTable(steps, subcomponents)}
      ${generateSubcomponentGuidelines(subcomponents, steps)}
    </section>
  `;
};

export const generateHierarchyTree = (
  activityTitle: string,
  activity: any,
  steps: any[],
  subcomponents: any[]
): string => {
  return `
    <div class="hierarchy-tree">
      <h3>Research Hierarchy</h3>
      <div class="tree-root">
        <div class="node-content">
          <div class="node-icon">📁</div>
          <div class="node-text">
            <div class="node-title">${activityTitle}</div>
            <div class="node-subtitle">Practice: ${activity.practice_percent}%</div>
          </div>
        </div>
        
        <div class="tree-branches">
          ${steps.map(step => {
            const stepSubcomponents = subcomponents.filter(sub => sub.step_id === step.step_id);
            return `
              <div class="tree-node">
                <div class="node-content">
                  <div class="node-icon">📄</div>
                  <div class="node-text">
                    <div class="node-title">${step.step?.name || 'Research Step'}</div>
                    <div class="node-subtitle">Time: ${step.time_percentage}% | Applied: ${step.applied_percentage}%</div>
                  </div>
                </div>
                
                ${stepSubcomponents.length > 0 ? `
                  <div class="tree-branches">
                    ${stepSubcomponents.map(sub => `
                      <div class="tree-node">
                        <div class="node-content">
                          <div class="node-icon">🔬</div>
                          <div class="node-text">
                            <div class="node-title">${sub.rd_research_subcomponents?.name || 'Subcomponent'}</div>
                            <div class="node-subtitle">
                              Frequency: ${sub.frequency_percentage}% | 
                              Start: ${sub.start_month}/${sub.start_year}
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
};

export const generateStepsTable = (steps: any[], subcomponents: any[]): string => {
  return `
    <div class="steps-section">
      <h3>Research Steps Overview</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Step Name</th>
            <th>Time %</th>
            <th>Applied %</th>
            <th>Subcomponents</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${steps.map(step => {
            const stepSubcomponents = subcomponents.filter(sub => sub.step_id === step.step_id);
            return `
              <tr id="step-${step.id}">
                <td><strong>${step.step?.name || 'Unnamed Step'}</strong></td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${step.time_percentage}%"></div>
                  </div>
                  ${step.time_percentage}%
                </td>
                <td>${step.applied_percentage}%</td>
                <td>${stepSubcomponents.length}</td>
                <td><span class="chip chip-success">Active</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

export const generateSubcomponentGuidelines = (subcomponents: any[], steps: any[]): string => {
  if (subcomponents.length === 0) return '';

  return `
    <div class="guidelines-section">
      <h3>Clinical Practice Guidelines</h3>
      
      ${subcomponents.map((sub, index) => {
        const step = steps.find(s => s.step_id === sub.step_id);
        const subData = sub.rd_research_subcomponents || sub;
        
        return `
          <div class="guideline-card">
            <div class="guideline-header">
              <h4>${index + 1}. ${subData.name || sub.step_name || 'Unnamed Subcomponent'}</h4>
              <div class="guideline-meta">
                <span class="chip chip-info">Step: ${step?.step?.name || 'Unknown'}</span>
                <span class="chip chip-warning">Frequency: ${sub.frequency_percentage}%</span>
                <span class="chip chip-success">Year Coverage: ${sub.year_percentage}%</span>
              </div>
            </div>

            <div class="guideline-sections">
              ${generateGuidelineSection('General Description', subData.general_description || sub.general_description, '📋')}
              ${generateGuidelineSection('Research Goal', subData.goal || sub.goal, '🎯')}
              ${generateGuidelineSection('Hypothesis', subData.hypothesis || sub.hypothesis, '💡')}
              ${generateGuidelineSection('Alternatives Considered', subData.alternatives || sub.alternatives, '🔄')}
              ${generateGuidelineSection('Uncertainties', subData.uncertainties || sub.uncertainties, '❓')}
              ${generateGuidelineSection('Development Process', subData.developmental_process || sub.developmental_process, '⚙️')}
              ${generateGuidelineSection('Primary Goal', subData.primary_goal || sub.primary_goal, '🏆')}
              ${generateGuidelineSection('Expected Outcomes', subData.expected_outcome_type || sub.expected_outcome_type, '📊')}
              
              ${(subData.cpt_codes || sub.cpt_codes) ? `
                <div class="codes-section">
                  <h5>📌 CPT Codes</h5>
                  <div class="codes-list">
                    ${(subData.cpt_codes || sub.cpt_codes).split(',').map((code: string) => 
                      `<span class="chip chip-primary">${code.trim()}</span>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${(subData.cdt_codes || sub.cdt_codes) ? `
                <div class="codes-section">
                  <h5>📌 CDT Codes</h5>
                  <div class="codes-list">
                    ${(subData.cdt_codes || sub.cdt_codes).split(',').map((code: string) => 
                      `<span class="chip chip-primary">${code.trim()}</span>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="timeline">
              <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                  <div class="timeline-date">Start Date</div>
                  <div class="timeline-title">${sub.start_month}/${sub.start_year}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

export const generateGuidelineSection = (title: string, content: string | null, icon: string): string => {
  if (!content) return '';
  
  return `
    <div class="guideline-section">
      <h5>${icon} ${title}</h5>
      <div class="guideline-content">
        ${content}
      </div>
    </div>
  `;
};

export const generateComplianceSummary = (): string => {
  return `
    <section id="compliance-summary" class="report-section">
      <div class="section-header">
        <div class="section-icon">✅</div>
        <div>
          <h2 class="section-title">Compliance Summary</h2>
          <p class="section-subtitle">Four-Part Test Qualification</p>
        </div>
      </div>

      <div class="compliance-grid">
        <div class="compliance-card">
          <div class="compliance-icon">🎯</div>
          <h3>Permitted Purpose</h3>
          <p>All activities are undertaken to develop new or improved business components</p>
          <span class="chip chip-success">✓ Qualified</span>
        </div>

        <div class="compliance-card">
          <div class="compliance-icon">🔬</div>
          <h3>Technological in Nature</h3>
          <p>Research relies on principles of physical or biological sciences</p>
          <span class="chip chip-success">✓ Qualified</span>
        </div>

        <div class="compliance-card">
          <div class="compliance-icon">❓</div>
          <h3>Elimination of Uncertainty</h3>
          <p>Activities aimed at eliminating technical uncertainty</p>
          <span class="chip chip-success">✓ Qualified</span>
        </div>

        <div class="compliance-card">
          <div class="compliance-icon">🧪</div>
          <h3>Process of Experimentation</h3>
          <p>Systematic trial and error methodology employed</p>
          <span class="chip chip-success">✓ Qualified</span>
        </div>
      </div>
    </section>
  `;
};

export const generateDocumentationChecklist = (): string => {
  return `
    <section id="documentation-checklist" class="report-section">
      <div class="section-header">
        <div class="section-icon">📋</div>
        <div>
          <h2 class="section-title">Documentation Checklist</h2>
          <p class="section-subtitle">Required Supporting Documentation</p>
        </div>
      </div>

      <div class="checklist-content">
        <ul class="guideline-list">
          <li>Clinical trial protocols and amendments</li>
          <li>Laboratory notebooks and experiment records</li>
          <li>Project meeting minutes and progress reports</li>
          <li>Technical specifications and design documents</li>
          <li>Test results and data analysis reports</li>
          <li>Time tracking records for research personnel</li>
          <li>Expense documentation for supplies and equipment</li>
          <li>Contractor agreements and statements of work</li>
          <li>Patent applications and technical publications</li>
          <li>Regulatory submissions and correspondence</li>
        </ul>
      </div>
    </section>
  `;
}; 