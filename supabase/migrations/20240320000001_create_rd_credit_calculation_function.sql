-- Create a function to calculate the total R&D credit
CREATE OR REPLACE FUNCTION calculate_rd_credit(
  p_qras JSONB,
  p_employees JSONB,
  p_contractors JSONB,
  p_supplies JSONB
) RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_total_credit DECIMAL(12,2) := 0;
  v_qra JSONB;
  v_employee JSONB;
  v_contractor JSONB;
  v_supply JSONB;
  v_qra_modifier JSONB;
  v_total_percentage DECIMAL(5,2);
BEGIN
  -- Calculate employee credit
  FOR v_employee IN SELECT * FROM jsonb_array_elements(p_employees)
  LOOP
    v_total_percentage := 0;
    
    -- Sum up the modification percentages for included QRAs
    FOR v_qra_modifier IN SELECT * FROM jsonb_array_elements(v_employee->'qraModifiers')
    LOOP
      IF (v_qra_modifier->>'included')::BOOLEAN THEN
        v_total_percentage := v_total_percentage + (v_qra_modifier->>'modificationPercentage')::DECIMAL;
      END IF;
    END LOOP;
    
    -- Add employee's contribution to total credit
    v_total_credit := v_total_credit + ((v_employee->>'w2Wage')::DECIMAL * (v_total_percentage / 100));
  END LOOP;
  
  -- Calculate contractor credit (65% of qualified expenses)
  FOR v_contractor IN SELECT * FROM jsonb_array_elements(p_contractors)
  LOOP
    v_total_percentage := 0;
    
    -- Sum up the modification percentages for included QRAs
    FOR v_qra_modifier IN SELECT * FROM jsonb_array_elements(v_contractor->'qraModifiers')
    LOOP
      IF (v_qra_modifier->>'included')::BOOLEAN THEN
        v_total_percentage := v_total_percentage + (v_qra_modifier->>'modificationPercentage')::DECIMAL;
      END IF;
    END LOOP;
    
    -- Add contractor's contribution to total credit (65% of qualified expenses)
    v_total_credit := v_total_credit + ((v_contractor->>'payment')::DECIMAL * 0.65 * (v_total_percentage / 100));
  END LOOP;
  
  -- Calculate supply credit
  FOR v_supply IN SELECT * FROM jsonb_array_elements(p_supplies)
  LOOP
    v_total_percentage := 0;
    
    -- Sum up the modification percentages for included QRAs
    FOR v_qra_modifier IN SELECT * FROM jsonb_array_elements(v_supply->'qraModifiers')
    LOOP
      IF (v_qra_modifier->>'included')::BOOLEAN THEN
        v_total_percentage := v_total_percentage + (v_qra_modifier->>'modificationPercentage')::DECIMAL;
      END IF;
    END LOOP;
    
    -- Add supply's contribution to total credit
    v_total_credit := v_total_credit + ((v_supply->>'cost')::DECIMAL * (v_total_percentage / 100));
  END LOOP;
  
  RETURN v_total_credit;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically calculate and update the total credit
CREATE OR REPLACE FUNCTION update_rd_credit_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_credit := calculate_rd_credit(
    NEW.qras,
    NEW.employees,
    NEW.contractors,
    NEW.supplies
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_rd_credit_total_trigger
  BEFORE INSERT OR UPDATE ON rd_credit_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_rd_credit_total(); 