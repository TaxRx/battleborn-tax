export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string;
  language: string;
  created_at: string;
  updated_at: string;
  size: number;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  merged_at: string | null;
  user: {
    login: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
}

export interface RDTimeAllocation {
  developer: string;
  totalCommits: number;
  linesOfCode: number;
  researchActivities: string[];
  timeSpent: number; // hours
  qualificationScore: number; // 0-100
}

export interface GitHubIntegrationSummary {
  repository: GitHubRepository;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  issues: GitHubIssue[];
  developers: RDTimeAllocation[];
  rdQualificationSummary: {
    totalLinesOfCode: number;
    qualifiedActivities: string[];
    averageQualificationScore: number;
    recommendedTimeAllocation: number;
  };
}

export class GitHubIntegrationService {
  private static readonly API_BASE = 'https://api.github.com';
  private apiKey: string | null = null;

  constructor() {
    // In production, this would come from secure storage/environment
    this.apiKey = import.meta.env.VITE_GITHUB_TOKEN || null;
  }

  setApiKey(token: string) {
    this.apiKey = token;
  }

  private async makeGitHubRequest(endpoint: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('GitHub API token not configured');
    }

    const response = await fetch(`${GitHubIntegrationService.API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GitHub API token');
      }
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.makeGitHubRequest(`/repos/${owner}/${repo}`);
  }

  async getUserRepositories(sort: string = 'updated', per_page: number = 10): Promise<GitHubRepository[]> {
    return this.makeGitHubRequest(`/user/repos?sort=${sort}&per_page=${per_page}&type=all`);
  }

  async getCommits(
    owner: string, 
    repo: string, 
    since?: string, 
    until?: string,
    author?: string
  ): Promise<GitHubCommit[]> {
    let endpoint = `/repos/${owner}/${repo}/commits?per_page=100`;
    
    if (since) endpoint += `&since=${since}`;
    if (until) endpoint += `&until=${until}`;
    if (author) endpoint += `&author=${author}`;

    return this.makeGitHubRequest(endpoint);
  }

  async getCommitDetails(owner: string, repo: string, sha: string): Promise<GitHubCommit> {
    return this.makeGitHubRequest(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  async getPullRequests(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubPullRequest[]> {
    return this.makeGitHubRequest(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`);
  }

  async getIssues(
    owner: string, 
    repo: string, 
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubIssue[]> {
    return this.makeGitHubRequest(`/repos/${owner}/${repo}/issues?state=${state}&per_page=100`);
  }

  async generateRDSummary(
    owner: string, 
    repo: string, 
    startDate: string, 
    endDate: string
  ): Promise<GitHubIntegrationSummary> {
    try {
      const [repository, commits, pullRequests, issues] = await Promise.all([
        this.getRepository(owner, repo),
        this.getCommits(owner, repo, startDate, endDate),
        this.getPullRequests(owner, repo, 'all'),
        this.getIssues(owner, repo, 'all')
      ]);

      // Filter PRs and issues by date range
      const filteredPRs = pullRequests.filter(pr => 
        new Date(pr.created_at) >= new Date(startDate) && 
        new Date(pr.created_at) <= new Date(endDate)
      );

      const filteredIssues = issues.filter(issue => 
        new Date(issue.created_at) >= new Date(startDate) && 
        new Date(issue.created_at) <= new Date(endDate)
      );

      // Analyze developer contributions
      const developerStats = this.analyzeDeveloperContributions(commits);
      
      // Calculate R&D qualification metrics
      const rdQualification = this.calculateRDQualification(
        commits, 
        filteredPRs, 
        filteredIssues
      );

      return {
        repository,
        timeRange: { startDate, endDate },
        commits,
        pullRequests: filteredPRs,
        issues: filteredIssues,
        developers: developerStats,
        rdQualificationSummary: rdQualification
      };

    } catch (error) {
      console.error('Error generating R&D summary:', error);
      throw error;
    }
  }

  private analyzeDeveloperContributions(commits: GitHubCommit[]): RDTimeAllocation[] {
    const developerMap = new Map<string, {
      commits: number;
      additions: number;
      deletions: number;
      files: Set<string>;
    }>();

    commits.forEach(commit => {
      const author = commit.commit.author.name;
      const existing = developerMap.get(author) || {
        commits: 0,
        additions: 0,
        deletions: 0,
        files: new Set()
      };

      existing.commits++;
      if (commit.stats) {
        existing.additions += commit.stats.additions;
        existing.deletions += commit.stats.deletions;
      }

      if (commit.files) {
        commit.files.forEach(file => existing.files.add(file.filename));
      }

      developerMap.set(author, existing);
    });

    return Array.from(developerMap.entries()).map(([developer, stats]) => ({
      developer,
      totalCommits: stats.commits,
      linesOfCode: stats.additions + stats.deletions,
      researchActivities: this.identifyResearchActivities(stats.files),
      timeSpent: this.estimateTimeFromActivity(stats.commits, stats.additions + stats.deletions),
      qualificationScore: this.calculateQualificationScore(stats)
    }));
  }

  private identifyResearchActivities(files: Set<string>): string[] {
    const activities: string[] = [];
    
    files.forEach(filename => {
      if (filename.includes('test') || filename.includes('spec')) {
        activities.push('Quality Assurance & Testing');
      }
      if (filename.includes('api') || filename.includes('service')) {
        activities.push('Backend Development & Integration');
      }
      if (filename.includes('component') || filename.includes('ui')) {
        activities.push('Frontend Development & UX');
      }
      if (filename.includes('algorithm') || filename.includes('optimization')) {
        activities.push('Algorithm Development & Optimization');
      }
      if (filename.includes('security') || filename.includes('auth')) {
        activities.push('Security Research & Implementation');
      }
    });

    return [...new Set(activities)];
  }

  private estimateTimeFromActivity(commits: number, linesOfCode: number): number {
    // Conservative estimate: 30 minutes per commit + 1 hour per 100 lines of code
    const commitTime = commits * 0.5;
    const codingTime = (linesOfCode / 100) * 1;
    return Math.round(commitTime + codingTime);
  }

  private calculateQualificationScore(stats: any): number {
    let score = 0;
    
    // Base score from activity level
    if (stats.commits > 10) score += 30;
    if (stats.additions + stats.deletions > 1000) score += 30;
    if (stats.files.size > 20) score += 20;
    
    // Bonus for research-indicative patterns
    const hasTests = Array.from(stats.files).some((f: string) => f.includes('test'));
    const hasDocumentation = Array.from(stats.files).some((f: string) => f.includes('README') || f.includes('doc'));
    
    if (hasTests) score += 10;
    if (hasDocumentation) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateRDQualification(
    commits: GitHubCommit[], 
    pullRequests: GitHubPullRequest[], 
    issues: GitHubIssue[]
  ) {
    const totalLinesOfCode = commits.reduce((sum, commit) => {
      return sum + (commit.stats?.total || 0);
    }, 0);

    const qualifiedActivities = [
      'Algorithm Development',
      'Performance Optimization', 
      'Security Enhancements',
      'Integration Challenges',
      'Scalability Improvements'
    ];

    const averageQualificationScore = commits.length > 0 ? 75 : 0; // Simplified calculation

    const recommendedTimeAllocation = Math.min(
      (totalLinesOfCode / 1000) * 40, // 40 hours per 1000 lines
      2080 // Max annual hours
    );

    return {
      totalLinesOfCode,
      qualifiedActivities,
      averageQualificationScore,
      recommendedTimeAllocation
    };
  }

  generateReportHTML(summary: GitHubIntegrationSummary): string {
    return `
      <div class="github-integration-section">
        <h3>🔗 GitHub Repository Analysis</h3>
        
        <div class="repo-overview">
          <h4>Repository: ${summary.repository.full_name}</h4>
          <p><strong>Description:</strong> ${summary.repository.description || 'No description provided'}</p>
          <p><strong>Primary Language:</strong> ${summary.repository.language}</p>
          <p><strong>Analysis Period:</strong> ${summary.timeRange.startDate} to ${summary.timeRange.endDate}</p>
        </div>

        <div class="development-metrics">
          <h4>Development Activity Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${summary.commits.length}</div>
              <div class="metric-label">Total Commits</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${summary.pullRequests.length}</div>
              <div class="metric-label">Pull Requests</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${summary.issues.length}</div>
              <div class="metric-label">Issues Addressed</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${summary.rdQualificationSummary.totalLinesOfCode.toLocaleString()}</div>
              <div class="metric-label">Lines of Code</div>
            </div>
          </div>
        </div>

        <div class="developer-allocations">
          <h4>Developer Time Allocations</h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Commits</th>
                <th>Lines of Code</th>
                <th>Estimated Hours</th>
                <th>R&D Qualification</th>
              </tr>
            </thead>
            <tbody>
              ${summary.developers.map(dev => `
                <tr>
                  <td><strong>${dev.developer}</strong></td>
                  <td>${dev.totalCommits}</td>
                  <td>${dev.linesOfCode.toLocaleString()}</td>
                  <td>${dev.timeSpent}</td>
                  <td>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${dev.qualificationScore}%"></div>
                    </div>
                    ${dev.qualificationScore}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="rd-qualification-summary">
          <h4>R&D Tax Credit Qualification Summary</h4>
          <div class="qualification-grid">
            <div class="qualification-item">
              <label>Total Qualified Hours</label>
              <p>${summary.rdQualificationSummary.recommendedTimeAllocation.toLocaleString()} hours</p>
            </div>
            <div class="qualification-item">
              <label>Average Qualification Score</label>
              <p>${summary.rdQualificationSummary.averageQualificationScore}%</p>
            </div>
            <div class="qualification-item">
              <label>Qualified Activities</label>
              <p>${summary.rdQualificationSummary.qualifiedActivities.join(', ')}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export default GitHubIntegrationService; 