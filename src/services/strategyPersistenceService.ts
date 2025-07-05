import { supabase } from '../lib/supabase';
import { TaxStrategy } from '../types';
import { TaxInfo } from '../lib/core/types/tax';
import { toast } from 'react-hot-toast';

export interface StrategyPersistenceService {
  saveStrategyDetails: (strategy: TaxStrategy, taxInfo: TaxInfo, year: number) => Promise<void>;
  loadStrategyDetails: (strategyId: string, taxInfo: TaxInfo, year: number) => Promise<TaxStrategy | null>;
  saveProposal: (taxInfo: TaxInfo, strategies: TaxStrategy[], year: number) => Promise<string>;
  loadProposal: (proposalId: string) => Promise<{ taxInfo: TaxInfo; strategies: TaxStrategy[] } | null>;
  testConnection: () => Promise<void>;
  // Admin-specific methods
  saveStrategyDetailsForAdminClient: (strategy: TaxStrategy, clientId: string, year: number) => Promise<void>;
  loadStrategyDetailsForAdminClient: (strategyId: string, clientId: string, year: number) => Promise<TaxStrategy | null>;
}

class StrategyPersistenceServiceImpl implements StrategyPersistenceService {
  async saveStrategyDetails(strategy: TaxStrategy, taxInfo: TaxInfo, year: number): Promise<void> {
    try {
      console.log(`🔍 Attempting to save strategy: ${strategy.id}`, { strategy, taxInfo, year });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found, skipping strategy persistence');
        return;
      }

      console.log(`✅ User authenticated: ${user.id}`);

      // First, ensure we have a tax proposal
      let proposalId = await this.getOrCreateProposal(taxInfo, year);
      console.log(`📋 Using proposal ID: ${proposalId}`);

      // Clean up any existing duplicate records for this strategy
      await this.cleanupDuplicateStrategyDetails(proposalId, strategy.id);

      // Small delay to ensure cleanup transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if strategy details already exist
      const { data: existingDetail, error: checkError } = await supabase
        .from('strategy_details')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('strategy_id', strategy.id)
        .maybeSingle();

      if (checkError) {
        console.warn(`⚠️ Error checking for existing strategy details:`, checkError);
      }

      let strategyDetail;
      if (existingDetail) {
        // Update existing record
        console.log(`🔄 Updating existing strategy details for ${strategy.id}`);
        const { data: updateResult, error: updateError } = await supabase
          .from('strategy_details')
          .update({
            strategy_name: strategy.name,
            strategy_category: strategy.category,
            details: strategy.details || {},
            estimated_savings: strategy.estimatedSavings,
            enabled: strategy.enabled
          })
          .eq('id', existingDetail.id)
          .select()
          .single();

        if (updateError) {
          console.error(`❌ Strategy details update error:`, updateError);
          throw updateError;
        }
        strategyDetail = updateResult;
      } else {
        // Insert new record
        console.log(`➕ Inserting new strategy details for ${strategy.id}`);
        const { data: insertResult, error: insertError } = await supabase
          .from('strategy_details')
          .insert({
            proposal_id: proposalId,
            strategy_id: strategy.id,
            strategy_name: strategy.name,
            strategy_category: strategy.category,
            details: strategy.details || {},
            estimated_savings: strategy.estimatedSavings,
            enabled: strategy.enabled
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Strategy details insert error:`, insertError);
          throw insertError;
        }
        strategyDetail = insertResult;
      }

      // Save strategy-specific details based on strategy type
      await this.saveStrategySpecificDetails(strategy, strategyDetail.id);

      // Show success toast for enabled strategies
      if (strategy.enabled) {
        toast.success(`${strategy.name} strategy saved successfully!`);
      }

    } catch (error) {
      console.error(`❌ Failed to save strategy details for ${strategy.id}:`, error);
      toast.error(`Failed to save ${strategy.name} strategy`);
      throw error;
    }
  }

  async loadStrategyDetails(strategyId: string, taxInfo: TaxInfo, year: number): Promise<TaxStrategy | null> {
    try {
      console.log(`🔍 Attempting to load strategy: ${strategyId}`, { taxInfo, year });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found, cannot load strategy details');
        return null;
      }

      console.log(`✅ User authenticated: ${user.id}`);

      // Get the proposal for this user and year - handle multiple proposals by getting the most recent one
      const { data: proposals, error: proposalError } = await supabase
        .from('tax_proposals')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', year)
        .order('created_at', { ascending: false })
        .limit(1);

      if (proposalError) {
        console.warn(`⚠️ Error finding proposals for user ${user.id} and year ${year}:`, proposalError);
        return null;
      }

      if (!proposals || proposals.length === 0) {
        console.log(`⚠️ No proposals found for user ${user.id} and year ${year}`);
        return null;
      }

      const proposal = proposals[0];
      console.log(`📋 Found proposal: ${proposal.id}`);

      // Get strategy details
      const { data: strategyDetail, error: strategyError } = await supabase
        .from('strategy_details')
        .select('*')
        .eq('proposal_id', proposal.id)
        .eq('strategy_id', strategyId)
        .maybeSingle();

      if (strategyError) {
        console.warn(`⚠️ Error loading strategy details for strategy ${strategyId}:`, strategyError);
        return null;
      }

      if (!strategyDetail) {
        console.log(`⚠️ No strategy details found for strategy ${strategyId} - strategy may not be saved yet`);
        return null;
      }

      console.log(`✅ Loaded strategy details:`, strategyDetail);

      // Load strategy-specific details
      const specificDetails = await this.loadStrategySpecificDetails(strategyId, strategyDetail.id);

      return {
        id: strategyDetail.strategy_id,
        name: strategyDetail.strategy_name,
        category: strategyDetail.strategy_category as any,
        description: '', // This would need to be stored or retrieved from strategy definitions
        estimatedSavings: strategyDetail.estimated_savings,
        enabled: strategyDetail.enabled,
        details: {
          ...strategyDetail.details,
          ...specificDetails
        }
      };

    } catch (error) {
      console.error(`❌ Failed to load strategy details for ${strategyId}:`, error);
      return null;
    }
  }

  async saveProposal(taxInfo: TaxInfo, strategies: TaxStrategy[], year: number): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const totalSavings = strategies
        .filter(s => s.enabled)
        .reduce((total, strategy) => total + strategy.estimatedSavings, 0);

      const { data: proposal, error } = await supabase
        .from('tax_proposals')
        .upsert({
          user_id: user.id,
          year,
          tax_info: taxInfo,
          proposed_strategies: strategies,
          total_savings: totalSavings,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Save individual strategy details
      for (const strategy of strategies) {
        if (strategy.enabled) {
          await this.saveStrategyDetails(strategy, taxInfo, year);
        }
      }

      return proposal.id;

    } catch (error) {
      console.error('Failed to save proposal:', error);
      throw error;
    }
  }

  async loadProposal(proposalId: string): Promise<{ taxInfo: TaxInfo; strategies: TaxStrategy[] } | null> {
    try {
      const { data: proposal, error } = await supabase
        .from('tax_proposals')
        .select(`
          *,
          strategy_details (*)
        `)
        .eq('id', proposalId)
        .single();

      if (error || !proposal) return null;

      // Load strategy-specific details for each strategy
      const strategies = await Promise.all(
        proposal.strategy_details.map(async (strategyDetail: any) => {
          const specificDetails = await this.loadStrategySpecificDetails(
            strategyDetail.strategy_id,
            strategyDetail.id
          );

          return {
            id: strategyDetail.strategy_id,
            name: strategyDetail.strategy_name,
            category: strategyDetail.strategy_category as any,
            description: '', // Would need to be retrieved from strategy definitions
            estimatedSavings: strategyDetail.estimated_savings,
            enabled: strategyDetail.enabled,
            details: {
              ...strategyDetail.details,
              ...specificDetails
            }
          };
        })
      );

      return {
        taxInfo: proposal.tax_info,
        strategies
      };

    } catch (error) {
      console.error('Failed to load proposal:', error);
      return null;
    }
  }

  private async getOrCreateProposal(taxInfo: TaxInfo, year: number): Promise<string> {
    console.log(`🔍 getOrCreateProposal called for year ${year}`);
    
    // Wait for user to be authenticated
    let user = null;
    for (let i = 0; i < 10; i++) { // Try for up to 1 second
      const { data: authData } = await supabase.auth.getUser();
      user = authData.user;
      if (user) break;
      await new Promise(res => setTimeout(res, 100));
    }
    if (!user) throw new Error('No authenticated user found');

    console.log(`👤 User authenticated: ${user.id}`);

    // Check if proposal exists - handle multiple proposals by getting the most recent one
    console.log(`🔍 Checking for existing proposals for user ${user.id} and year ${year}`);
    const { data: existingProposals, error: checkError } = await supabase
      .from('tax_proposals')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('year', year)
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.log(`⚠️ Error checking for existing proposals:`, checkError);
    }

    if (existingProposals && existingProposals.length > 0) {
      const mostRecentProposal = existingProposals[0];
      console.log(`✅ Found existing proposal: ${mostRecentProposal.id} (created: ${mostRecentProposal.created_at})`);
      return mostRecentProposal.id;
    }

    console.log(`📝 Creating new proposal for user ${user.id} and year ${year}`);
    // Create new proposal
    const { data: newProposal, error } = await supabase
      .from('tax_proposals')
      .insert({
        user_id: user.id,
        year,
        tax_info: taxInfo,
        proposed_strategies: [],
        total_savings: 0,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating proposal:`, error);
      throw error;
    }
    
    console.log(`✅ Created new proposal: ${newProposal.id}`);
    return newProposal.id;
  }

  private async saveStrategySpecificDetails(strategy: TaxStrategy, strategyDetailId: string): Promise<void> {
    try {
      switch (strategy.id) {
        case 'augusta_rule':
          if (strategy.details?.augustaRule) {
            await supabase
              .from('augusta_rule_details')
              .upsert({
                strategy_detail_id: strategyDetailId,
                days_rented: strategy.details.augustaRule.daysRented,
                daily_rate: strategy.details.augustaRule.dailyRate,
                total_rent: strategy.details.augustaRule.totalRent,
                state_benefit: strategy.details.augustaRule.stateBenefit,
                federal_benefit: strategy.details.augustaRule.federalBenefit,
                fica_benefit: strategy.details.augustaRule.ficaBenefit,
                total_benefit: strategy.details.augustaRule.totalBenefit
              });
          }
          break;

        case 'charitable_donation':
          if (strategy.details?.charitableDonation) {
            try {
              await supabase
                .from('charitable_donation_details')
                .upsert({
                  strategy_detail_id: strategyDetailId,
                  donation_amount: strategy.details.charitableDonation.donationAmount,
                  fmv_multiplier: strategy.details.charitableDonation.fmvMultiplier,
                  agi_limit: (strategy.details.charitableDonation as any).agiLimit,
                  deduction_value: strategy.details.charitableDonation.deductionValue,
                  federal_savings: strategy.details.charitableDonation.federalSavings,
                  state_savings: strategy.details.charitableDonation.stateSavings,
                  total_benefit: strategy.details.charitableDonation.totalBenefit
                });
            } catch (error) {
              console.warn('charitable_donation_details table not available, saving to general details only:', error);
            }
          }
          break;

        case 'hire_children':
          if (strategy.details?.hireChildren) {
            try {
              await supabase
                .from('hire_children_details')
                .upsert({
                  strategy_detail_id: strategyDetailId,
                  children: strategy.details.hireChildren.children,
                  total_salaries: strategy.details.hireChildren.totalSalaries,
                  state_benefit: strategy.details.hireChildren.stateBenefit,
                  federal_benefit: strategy.details.hireChildren.federalBenefit,
                  fica_benefit: strategy.details.hireChildren.ficaBenefit,
                  total_benefit: strategy.details.hireChildren.totalBenefit
                });
            } catch (error) {
              console.warn('hire_children_details table not available, saving to general details only:', error);
            }
          }
          break;

        case 'cost_segregation':
          if (strategy.details?.costSegregation) {
            try {
              await supabase
                .from('cost_segregation_details')
                .upsert({
                  strategy_detail_id: strategyDetailId,
                  property_value: strategy.details.costSegregation.propertyValue,
                  land_value: strategy.details.costSegregation.landValue,
                  improvement_value: strategy.details.costSegregation.improvementValue,
                  bonus_depreciation_rate: strategy.details.costSegregation.bonusDepreciationRate,
                  year_acquired: strategy.details.costSegregation.yearAcquired,
                  current_year_deduction: strategy.details.costSegregation.currentYearDeduction,
                  years_2_to_5_annual: strategy.details.costSegregation.years2to5Annual,
                  total_savings: strategy.details.costSegregation.totalSavings
                });
            } catch (error) {
              console.warn('cost_segregation_details table not available, saving to general details only:', error);
            }
          }
          break;

        case 'convertible_tax_bonds':
          if (strategy.details?.convertibleTaxBonds) {
            await supabase
              .from('convertible_tax_bonds_details')
              .upsert({
                strategy_detail_id: strategyDetailId,
                ctb_payment: strategy.details.convertibleTaxBonds.ctbPayment,
                ctb_tax_offset: strategy.details.convertibleTaxBonds.ctbTaxOffset,
                net_savings: strategy.details.convertibleTaxBonds.netSavings,
                remaining_tax_after_ctb: strategy.details.convertibleTaxBonds.remainingTaxAfterCtb,
                reduction_ratio: strategy.details.convertibleTaxBonds.reductionRatio
              });
          }
          break;

        case 'family_management_company':
          if (strategy.details?.familyManagementCompany) {
            await supabase
              .from('family_management_company_details')
              .upsert({
                strategy_detail_id: strategyDetailId,
                members: strategy.details.familyManagementCompany.members,
                total_salaries: strategy.details.familyManagementCompany.totalSalaries,
                state_benefit: strategy.details.familyManagementCompany.stateBenefit,
                federal_benefit: strategy.details.familyManagementCompany.federalBenefit,
                fica_benefit: strategy.details.familyManagementCompany.ficaBenefit,
                total_benefit: strategy.details.familyManagementCompany.totalBenefit
              });
          }
          break;

        case 'reinsurance':
          if (strategy.details?.reinsurance) {
            await supabase
              .from('reinsurance_details')
              .upsert({
                strategy_detail_id: strategyDetailId,
                user_contribution: strategy.details.reinsurance.userContribution,
                agi_reduction: strategy.details.reinsurance.agiReduction,
                federal_tax_benefit: strategy.details.reinsurance.federalTaxBenefit,
                state_tax_benefit: strategy.details.reinsurance.stateTaxBenefit,
                total_tax_savings: strategy.details.reinsurance.totalTaxSavings,
                net_year1_cost: strategy.details.reinsurance.netYear1Cost,
                breakeven_years: strategy.details.reinsurance.breakevenYears,
                future_value: strategy.details.reinsurance.futureValue,
                capital_gains_tax: strategy.details.reinsurance.capitalGainsTax,
                setup_admin_cost: strategy.details.reinsurance.setupAdminCost
              });
          }
          break;
      }
    } catch (error) {
      console.error('Error saving strategy specific details:', error);
      // Don't throw - let the general details save succeed
    }
  }

  private async loadStrategySpecificDetails(strategyId: string, strategyDetailId: string): Promise<any> {
    try {
      switch (strategyId) {
        case 'augusta_rule':
          try {
            const { data: augustaData } = await supabase
              .from('augusta_rule_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (augustaData) {
              return {
                augustaRule: {
                  daysRented: augustaData.days_rented,
                  dailyRate: augustaData.daily_rate,
                  totalRent: augustaData.total_rent,
                  stateBenefit: augustaData.state_benefit,
                  federalBenefit: augustaData.federal_benefit,
                  ficaBenefit: augustaData.fica_benefit,
                  totalBenefit: augustaData.total_benefit
                }
              };
            }
          } catch (error) {
            console.warn('augusta_rule_details table not available:', error);
          }
          break;

        case 'charitable_donation':
          try {
            const { data: charitableDonationData } = await supabase
              .from('charitable_donation_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (charitableDonationData) {
              return {
                charitableDonation: {
                  donationAmount: charitableDonationData.donation_amount,
                  fmvMultiplier: charitableDonationData.fmv_multiplier,
                  agiLimit: charitableDonationData.agi_limit,
                  deductionValue: charitableDonationData.deduction_value,
                  federalSavings: charitableDonationData.federal_savings,
                  stateSavings: charitableDonationData.state_savings,
                  totalBenefit: charitableDonationData.total_benefit
                }
              };
            }
          } catch (error) {
            console.warn('charitable_donation_details table not available:', error);
          }
          break;

        case 'hire_children':
          try {
            const { data: hireChildrenData } = await supabase
              .from('hire_children_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (hireChildrenData) {
              return {
                hireChildren: {
                  children: hireChildrenData.children,
                  totalSalaries: hireChildrenData.total_salaries,
                  stateBenefit: hireChildrenData.state_benefit,
                  federalBenefit: hireChildrenData.federal_benefit,
                  ficaBenefit: hireChildrenData.fica_benefit,
                  totalBenefit: hireChildrenData.total_benefit
                }
              };
            }
          } catch (error) {
            console.warn('hire_children_details table not available:', error);
          }
          break;

        case 'cost_segregation':
          try {
            const { data: costSegregationData } = await supabase
              .from('cost_segregation_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (costSegregationData) {
              return {
                costSegregation: {
                  propertyValue: costSegregationData.property_value,
                  landValue: costSegregationData.land_value,
                  improvementValue: costSegregationData.improvement_value,
                  bonusDepreciationRate: costSegregationData.bonus_depreciation_rate,
                  yearAcquired: costSegregationData.year_acquired,
                  currentYearDeduction: costSegregationData.current_year_deduction,
                  years2to5Annual: costSegregationData.years_2_to_5_annual,
                  totalSavings: costSegregationData.total_savings
                }
              };
            }
          } catch (error) {
            console.warn('cost_segregation_details table not available:', error);
          }
          break;

        case 'convertible_tax_bonds':
          try {
            const { data: ctbData } = await supabase
              .from('convertible_tax_bonds_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (ctbData) {
              return {
                convertibleTaxBonds: {
                  ctbPayment: ctbData.ctb_payment,
                  ctbTaxOffset: ctbData.ctb_tax_offset,
                  netSavings: ctbData.net_savings,
                  remainingTaxAfterCtb: ctbData.remaining_tax_after_ctb,
                  reductionRatio: ctbData.reduction_ratio
                }
              };
            }
          } catch (error) {
            console.warn('convertible_tax_bonds_details table not available:', error);
          }
          break;

        case 'family_management_company':
          try {
            const { data: fmcData } = await supabase
              .from('family_management_company_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (fmcData) {
              return {
                familyManagementCompany: {
                  members: fmcData.members,
                  totalSalaries: fmcData.total_salaries,
                  stateBenefit: fmcData.state_benefit,
                  federalBenefit: fmcData.federal_benefit,
                  ficaBenefit: fmcData.fica_benefit,
                  totalBenefit: fmcData.total_benefit
                }
              };
            }
          } catch (error) {
            console.warn('family_management_company_details table not available:', error);
          }
          break;

        case 'reinsurance':
          try {
            const { data: reinsuranceData } = await supabase
              .from('reinsurance_details')
              .select('*')
              .eq('strategy_detail_id', strategyDetailId)
              .single();
            
            if (reinsuranceData) {
              return {
                reinsurance: {
                  userContribution: reinsuranceData.user_contribution,
                  agiReduction: reinsuranceData.agi_reduction,
                  federalTaxBenefit: reinsuranceData.federal_tax_benefit,
                  stateTaxBenefit: reinsuranceData.state_tax_benefit,
                  totalTaxSavings: reinsuranceData.total_tax_savings,
                  netYear1Cost: reinsuranceData.net_year1_cost,
                  breakevenYears: reinsuranceData.breakeven_years,
                  futureValue: reinsuranceData.future_value,
                  capitalGainsTax: reinsuranceData.capital_gains_tax,
                  setupAdminCost: reinsuranceData.setup_admin_cost
                }
              };
            }
          } catch (error) {
            console.warn('reinsurance_details table not available:', error);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading strategy specific details:', error);
    }

    return {};
  }

  // Debug function to test Supabase connection
  async testConnection(): Promise<void> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User:', user ? `ID: ${user.id}` : 'No user');
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Test basic query without filters
      console.log('🔍 Testing basic tax_proposals query...');
      const { data: basicData, error: basicError } = await supabase
        .from('tax_proposals')
        .select('count')
        .limit(1);
      
      console.log('📊 Basic query result:', { data: basicData, error: basicError });

      // Test query with user filter
      console.log('🔍 Testing tax_proposals query with user filter...');
      const { data: userData, error: userError } = await supabase
        .from('tax_proposals')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      console.log('📊 User query result:', { data: userData, error: userError });

      // Test query with year filter
      console.log('🔍 Testing tax_proposals query with year filter...');
      const { data: yearData, error: yearError } = await supabase
        .from('tax_proposals')
        .select('id')
        .eq('year', 2025)
        .limit(1);
      
      console.log('📊 Year query result:', { data: yearData, error: yearError });

      // Test the exact query that's failing
      console.log('🔍 Testing exact failing query...');
      const { data: exactData, error: exactError } = await supabase
        .from('tax_proposals')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', 2025);
      
      console.log('📊 Exact query result:', { data: exactData, error: exactError });

    } catch (error) {
      console.error('❌ Test connection error:', error);
    }
  }

  private async cleanupDuplicateStrategyDetails(proposalId: string, strategyId: string): Promise<void> {
    try {
      console.log(`🧹 Cleaning up duplicate strategy details for proposal ${proposalId}, strategy ${strategyId}`);
      
      // Delete ALL existing records for this proposal and strategy (not just one)
      const { data: deleteResult, error: deleteError } = await supabase
        .from('strategy_details')
        .delete()
        .eq('proposal_id', proposalId)
        .eq('strategy_id', strategyId);

      if (deleteError) {
        console.warn(`⚠️ Error cleaning up existing strategy details:`, deleteError);
      } else {
        console.log(`✅ Cleaned up existing strategy details for ${strategyId}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up strategy details:', error);
    }
  }

  async saveStrategyDetailsForAdminClient(strategy: TaxStrategy, clientId: string, year: number): Promise<void> {
    try {
      console.log(`💾 Saving strategy details for admin client ${clientId}:`, strategy);
      
      // Check if strategy details already exist for this client and strategy
      const { data: existingStrategy, error: checkError } = await supabase
        .from('admin_strategy_details')
        .select('id')
        .eq('client_file_id', clientId)
        .eq('strategy_id', strategy.id)
        .eq('year', year)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing strategy details:', checkError);
        throw checkError;
      }

      const strategyData = {
        client_file_id: clientId,
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        strategy_category: strategy.category,
        year: year,
        enabled: strategy.enabled,
        estimated_savings: strategy.estimatedSavings,
        details: strategy.details || {},
        created_at: existingStrategy ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingStrategy) {
        // Update existing strategy details
        const { error: updateError } = await supabase
          .from('admin_strategy_details')
          .update(strategyData)
          .eq('id', existingStrategy.id);

        if (updateError) {
          console.error('Error updating admin strategy details:', updateError);
          throw updateError;
        }
      } else {
        // Insert new strategy details
        const { error: insertError } = await supabase
          .from('admin_strategy_details')
          .insert([strategyData]);

        if (insertError) {
          console.error('Error inserting admin strategy details:', insertError);
          throw insertError;
        }
      }

      console.log(`✅ Successfully saved strategy details for admin client ${clientId}`);
    } catch (error) {
      console.error(`❌ Failed to save strategy details for admin client ${clientId}:`, error);
      throw error;
    }
  }

  async loadStrategyDetailsForAdminClient(strategyId: string, clientId: string, year: number): Promise<TaxStrategy | null> {
    try {
      console.log(`🔍 Loading strategy details for admin client ${clientId}: ${strategyId}`);
      
      const { data: strategyDetail, error: strategyError } = await supabase
        .from('admin_strategy_details')
        .select('*')
        .eq('client_file_id', clientId)
        .eq('strategy_id', strategyId)
        .eq('year', year)
        .maybeSingle();

      if (strategyError) {
        console.warn(`⚠️ Error loading admin strategy details for strategy ${strategyId}:`, strategyError);
        return null;
      }

      if (!strategyDetail) {
        console.log(`⚠️ No admin strategy details found for strategy ${strategyId} - strategy may not be saved yet`);
        return null;
      }

      console.log(`✅ Loaded admin strategy details:`, strategyDetail);

      return {
        id: strategyDetail.strategy_id,
        name: strategyDetail.strategy_name,
        category: strategyDetail.strategy_category as any,
        description: '', // This would need to be stored or retrieved from strategy definitions
        estimatedSavings: strategyDetail.estimated_savings,
        enabled: strategyDetail.enabled,
        details: strategyDetail.details || {}
      };

    } catch (error) {
      console.error(`❌ Failed to load admin strategy details for ${strategyId}:`, error);
      return null;
    }
  }
}

export const strategyPersistenceService = new StrategyPersistenceServiceImpl(); 