// Report Generator Helper Functions for Clinical Practice Guideline Report
// aiService removed - using static report generation

import { supabase } from '../../lib/supabase';
import { GitHubIntegrationService } from '../../../../services/githubIntegrationService';

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
        <a href="#executive-summary" class="toc-item" onclick="scrollToSection('executive-summary'); return false;">Executive Summary</a>
        <a href="#business-profile" class="toc-item" onclick="scrollToSection('business-profile'); return false;">Business Profile</a>
        <a href="#research-overview" class="toc-item" onclick="scrollToSection('research-overview'); return false;">Research Overview</a>
      </div>

      <div class="toc-section">
        <div class="toc-section-title">Research Activities</div>
        ${Array.from(activitiesMap.entries()).map(([activityId, data], index) => `
          <a href="#activity-${activityId}" class="toc-item" onclick="scrollToSection('activity-${activityId}'); return false;">
            ${index + 1}. ${data.activity.activity?.title || 'Research Activity'}
          </a>
          ${data.steps.map((step: any) => `
            <a href="#step-${step.id}" class="toc-item toc-sub-item" onclick="scrollToSection('step-${step.id}'); return false;">
              ${step.step?.name || 'Research Step'}
            </a>
          `).join('')}
        `).join('')}
      </div>

      <div class="toc-section">
        <div class="toc-section-title">Appendices</div>
        <a href="#compliance-summary" class="toc-item" onclick="scrollToSection('compliance-summary'); return false;">Compliance Summary</a>
        <a href="#documentation-checklist" class="toc-item" onclick="scrollToSection('documentation-checklist'); return false;">Documentation Checklist</a>
      </div>
    </nav>

    <script>
      function scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Update active states
          document.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
          event.target.classList.add('active');
        }
      }

      // Add scroll spy functionality
      window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('.report-section[id]');
        const tocItems = document.querySelectorAll('.toc-item');
        
        let current = '';
        sections.forEach(section => {
          const sectionTop = section.offsetTop - 100;
          if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
          }
        });

        tocItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('onclick')?.includes(current)) {
            item.classList.add('active');
          }
        });
      });
    </script>
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

export const generateActivitySection = async (
  activityId: string,
  data: any,
  activityIndex: number,
  businessRoles: Array<{id: string, name: string}> = [],
  businessCategory: string = 'healthcare',
  businessProfile: any = null
): Promise<string> => {
  const { activity, steps, subcomponents } = data;
  const activityTitle = activity.activity?.title || `Research Activity ${activityIndex + 1}`;

  const subcomponentGuidelines = await generateSubcomponentGuidelines(subcomponents, steps, businessRoles, businessCategory, businessProfile);

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
      ${subcomponentGuidelines}
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
            
            // Calculate step-level applied percentage by summing subcomponent applied percentages
            const stepAppliedPercent = stepSubcomponents.reduce((sum, sub) => {
              return sum + (sub.applied_percentage || 0);
            }, 0);
            
            return `
              <div class="tree-node">
                <div class="node-content">
                  <div class="node-icon">📄</div>
                  <div class="node-text">
                    <div class="node-title">${step.step?.name || 'Research Step'}</div>
                    <div class="node-subtitle">Time: ${step.time_percentage || 0}% | Applied: ${stepAppliedPercent.toFixed(2)}%</div>
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
                              Applied: ${(sub.applied_percentage || 0).toFixed(2)}% | 
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
            <th style="width: 35%;">Time %</th>
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
                <td style="width: 35%;">
                  <div class="progress-bar-extended">
                    <div class="progress-fill" style="width: ${step.time_percentage || 0}%"></div>
                    <span class="progress-text">${step.time_percentage || 0}%</span>
                  </div>
                </td>
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

export const generateSubcomponentGuidelines = async (
  subcomponents: any[], 
  steps: any[], 
  businessRoles: Array<{id: string, name: string}> = [],
  businessCategory: string = 'healthcare',
  businessProfile: any = null
): Promise<string> => {
  if (subcomponents.length === 0) return '';

  const isSoftwareReport = businessCategory === 'software';

  // Ensure businessRoles is always an array with fallback values
  const safeBusinessRoles = businessRoles && businessRoles.length > 0 
    ? businessRoles 
    : isSoftwareReport 
      ? [
          { id: 'default-1', name: 'Software Developers' },
          { id: 'default-2', name: 'Technical Leads' },
          { id: 'default-3', name: 'QA Engineers' },
          { id: 'default-4', name: 'DevOps Engineers' },
          { id: 'default-5', name: 'Product Managers' }
        ]
      : [
          { id: 'default-1', name: 'Medical Staff' },
          { id: 'default-2', name: 'Administrative Staff' },
          { id: 'default-3', name: 'Research Coordinators' }
        ];

  // Import AI service for generating content
  let AIService: any = null;
  try {
    const aiModule = await import('../../../../services/aiService');
    AIService = aiModule.AIService;
  } catch (error) {
    console.warn('AI Service not available, using fallback content');
  }

  // Generate AI-powered best practices for each subcomponent
  const subcomponentSummaries = [];
  
  for (const sub of subcomponents) {
    const subData = sub.rd_research_subcomponents || sub;
    
    // Generate AI-powered or fallback content
    const componentName = subData.name || subData.general_description || 'Subcomponent';
    const description = subData.general_description || subData.description || '';
    
    let bestPractices = '';
    
    // Try to generate AI content first
    if (AIService) {
      try {
        console.log(`🤖 Generating AI content for: ${componentName}`);
        
        const prompt = isSoftwareReport ? 
          `Generate comprehensive IRS R&D tax credit documentation for "${componentName}" in a software development environment.

Component Description: ${description}

Development Team Roles: ${safeBusinessRoles.map(role => role.name).join(', ')}

Please provide:
1. Technical uncertainty documentation and challenges addressed
2. Process of experimentation details (iterations, testing, alternatives)
3. Qualified purpose demonstration (functionality, performance, reliability improvements)
4. Technological nature evidence (computer science/engineering principles)
5. Specific role assignments with time allocation estimates
6. Documentation requirements for IRS audit defense

Format the response with proper HTML headings (h4, h5) and lists (ul, li) for integration into a research report.` :
          `Generate professional clinical practice guidelines for implementing "${componentName}" in a healthcare setting.

Subcomponent Description: ${description}

Available Staff Roles: ${safeBusinessRoles.map(role => role.name).join(', ')}

Please provide:
1. Step-by-step implementation guidelines with clear headings
2. For each step, specify which staff roles should be involved
3. Use professional medical/clinical language
4. Include bullet points for role assignments under each step
5. Quality assurance and documentation requirements

Format the response with proper HTML headings (h4, h5) and lists (ul, li) for integration into a research report.`;

        const aiResponse = await AIService.getInstance().generateResearchContent(prompt, {
          businessCategory: businessCategory,
          componentName,
          availableRoles: safeBusinessRoles
        });
        
        bestPractices = formatAIContent(aiResponse);
        console.log(`✅ AI content generated for: ${componentName}`);
        
      } catch (error) {
        console.warn(`❌ AI generation failed for ${componentName}, using fallback:`, error);
        bestPractices = await generateFallbackContent(componentName, description, safeBusinessRoles, isSoftwareReport, businessProfile?.github_token);
      }
    } else {
      // Use fallback content when AI is not available
      bestPractices = await generateFallbackContent(componentName, description, safeBusinessRoles, isSoftwareReport, businessProfile?.github_token);
    }

    subcomponentSummaries.push({ ...sub, aiGeneratedBestPractices: bestPractices });
  }

  return `
    <div class="guidelines-section">
      <h3>${isSoftwareReport ? 'IRS R&D Substantiation Documentation' : 'Clinical Practice Guidelines'}</h3>
      
      ${subcomponentSummaries.map((sub, index) => {
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

            ${sub.aiGeneratedBestPractices ? `
              <div class="ai-best-practices">
                <div class="ai-header">
                  <h5>🧬 Practice Guideline</h5>
                  <div class="ai-controls">
                    <button class="ai-control-btn" onclick="regenerateAISection('${sub.id}')" title="Regenerate">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/>
                      </svg>
                    </button>
                    <button class="ai-control-btn" onclick="editAIPrompt('${sub.id}')" title="Edit Prompt">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="best-practices-content">
                  ${formatAIContent(sub.aiGeneratedBestPractices)}
                </div>
              </div>
            ` : ''}

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

const generateGitHubContent = async (
  githubToken: string,
  repositoryName?: string
): Promise<string> => {
  try {
    const githubService = new GitHubIntegrationService();
    githubService.setApiKey(githubToken);

    // Get user's repositories (up to 5 most recent)
    const repos = await githubService.getUserRepositories('updated', 5);
    
    if (!repos || repos.length === 0) {
      return `
        <li><strong>GitHub Status:</strong> Token configured but no repositories found</li>
        <li><strong>Recommendation:</strong> Verify repository access permissions for the provided token</li>
      `;
    }

    let content = '';
    
    // Process up to 3 repositories for the report
    const reposToAnalyze = repos.slice(0, 3);
    
    for (const repo of reposToAnalyze) {
      try {
        // Get commit data for the repository
        const commits = await githubService.getCommits(repo.owner.login, repo.name);
        const recentCommits = commits.slice(0, 10); // Last 10 commits
        
        // Calculate development metrics
        const totalCommits = commits.length;
        const recentActivity = recentCommits.length;
        const linesChanged = recentCommits.reduce((total, commit) => 
          total + (commit.stats?.total || 0), 0);
        
        content += `
          <li><strong>Repository: ${repo.name}</strong>
            <ul>
              <li>Total commits: ${totalCommits}</li>
              <li>Recent activity: ${recentActivity} commits in last analysis</li>
              <li>Lines of code changed: ${linesChanged.toLocaleString()}</li>
              <li>Primary language: ${repo.language || 'Not specified'}</li>
              <li>Last updated: ${new Date(repo.updated_at).toLocaleDateString()}</li>
            </ul>
          </li>
        `;
        
        // Get pull requests for R&D documentation
        try {
          const pullRequests = await githubService.getPullRequests(repo.owner.login, repo.name);
          const openPRs = pullRequests.filter(pr => pr.state === 'open').length;
          const mergedPRs = pullRequests.filter(pr => pr.state === 'closed' && pr.merged_at).length;
          
          if (pullRequests.length > 0) {
            content += `
              <li><strong>Pull Requests for ${repo.name}:</strong>
                <ul>
                  <li>Total PRs: ${pullRequests.length}</li>
                  <li>Open PRs: ${openPRs}</li>
                  <li>Merged PRs: ${mergedPRs}</li>
                  <li>Code review evidence: ${mergedPRs} technical discussions documented</li>
                </ul>
              </li>
            `;
          }
        } catch (prError) {
          console.warn(`Could not fetch PRs for ${repo.name}:`, prError);
        }
        
      } catch (repoError) {
        console.warn(`Error analyzing repository ${repo.name}:`, repoError);
        content += `
          <li><strong>Repository: ${repo.name}</strong> - Analysis error (check token permissions)</li>
        `;
      }
    }
    
    return content;
    
  } catch (error) {
    console.error('GitHub integration error:', error);
    return `
      <li><strong>GitHub Integration Error:</strong> ${error.message || 'Unable to connect to GitHub API'}</li>
      <li><strong>Troubleshooting:</strong> Verify token validity and repository access permissions</li>
    `;
  }
};

// Helper function to generate fallback content when AI is not available
const generateFallbackContent = async (
  componentName: string, 
  description: string, 
  businessRoles: Array<{id: string, name: string}>, 
  isSoftwareReport: boolean,
  githubToken?: string
): Promise<string> => {
  let githubContent = '';
  if (githubToken) {
    try {
      githubContent = await generateGitHubContent(githubToken);
    } catch (error) {
      console.warn('Failed to generate GitHub content from token, using fallback:', error);
      githubContent = `
        <li><strong>GitHub Status:</strong> Token configured but failed to fetch data (check token permissions)</li>
        <li><strong>Recommendation:</strong> Verify repository access permissions for the provided token</li>
      `;
    }
  }

  return isSoftwareReport ? `<h4>IRS Substantiation Documentation for ${componentName}</h4>
<p><strong>R&D Activity Overview:</strong><br>
${description || 'Software development research and experimentation activities qualifying under IRC Section 41.'}</p>

<h5>IRS Compliance Requirements:</h5>
<ul>
  <li><strong>Technical Uncertainty:</strong> Document the technological challenges and uncertainties addressed by ${componentName}</li>
  <li><strong>Process of Experimentation:</strong> Maintain detailed records of development iterations, testing, and alternative approaches</li>
  <li><strong>Qualified Purpose:</strong> Demonstrate how this work improves functionality, performance, reliability, or quality</li>
  <li><strong>Technological in Nature:</strong> Evidence that the work relies on principles of computer science, engineering, or physical sciences</li>
  <li><strong>Documentation Standards:</strong> Version control logs, commit histories, sprint retrospectives, and technical specifications</li>
</ul>

<h5>Development Team Roles & Time Allocation:</h5>
<ul>
  ${businessRoles.map(role => `<li><strong>${role.name}:</strong> Qualified personnel directly engaged in R&D activities with documented time tracking</li>`).join('')}
</ul>

<h5>GitHub Integration & Documentation:</h5>
<ul>
  ${githubContent}
  <li>Repository commit analysis and feature development tracking</li>
  <li>Pull request reviews and technical discussions</li>
  <li>Issue tracking for technical challenges and resolutions</li>
  <li>Release notes documenting technological improvements</li>
  <li>Automated testing results and quality metrics</li>
</ul>

<h5>Key Performance Indicators:</h5>
<ul>
  <li>Lines of code developed for ${componentName}</li>
  <li>Number of technical challenges resolved</li>
  <li>Testing coverage and quality improvements</li>
  <li>Time spent on qualified research activities</li>
  <li>Documentation completeness for IRS audit defense</li>
</ul>` : `<h4>Best Practices for ${componentName}</h4>
<p><strong>Research Component Overview:</strong><br>
${description || 'Detailed research component focused on systematic investigation and development activities.'}</p>

<h5>Key Implementation Guidelines:</h5>
<ul>
  <li><strong>Documentation Standards:</strong> Maintain comprehensive records of all research activities, methodologies, and findings for this component</li>
  <li><strong>Quality Assurance:</strong> Implement systematic review processes and validation procedures specific to ${componentName}</li>
  <li><strong>Resource Management:</strong> Optimize allocation of personnel, equipment, and materials for maximum research efficiency</li>
  <li><strong>Compliance Management:</strong> Ensure adherence to regulatory requirements and industry standards relevant to this research area</li>
  <li><strong>Progress Monitoring:</strong> Regular assessment and refinement of research processes and methodologies</li>
</ul>

<h5>Role Assignments:</h5>
<ul>
  ${businessRoles.map(role => `<li><strong>${role.name}:</strong> Participate in research activities according to their expertise and defined responsibilities</li>`).join('')}
</ul>

<h5>Performance Metrics:</h5>
<ul>
  <li>Research milestone completion rates for ${componentName}</li>
  <li>Quality of deliverables and outcomes</li>
  <li>Resource utilization efficiency</li>
  <li>Compliance audit results</li>
  <li>Innovation impact assessment</li>
</ul>`;
};

// Helper function to format AI-generated content with proper markdown support
export const formatAIContent = (content: string): string => {
  if (!content) return '';
  
  // Convert markdown headings and formatting to proper HTML
  let formatted = content
    // Convert headings first
    .replace(/^### (.+)$/gm, '<h3 class="ai-section-heading">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ai-main-heading">$1</h2>')
    // Convert **bold**: at start of line to step titles
    .replace(/^\*\*(.+?)\*\*:$/gm, '<h4 class="ai-step-title">$1:</h4>')
    // Convert **bold** anywhere in text (fixed regex)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Convert numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Handle line breaks
    .replace(/\n\n/g, '</p><p>')
    // Wrap non-HTML content in paragraphs
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>');

  // Wrap consecutive <li> elements in <ul>
  formatted = formatted.replace(/(<li>.*?<\/li>)(?:\s*<li>.*?<\/li>)*/g, '<ul>$&</ul>');
  
  // Clean up empty paragraphs and fix spacing
  formatted = formatted
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\n\s*\n/g, '\n');
  
  return formatted;
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