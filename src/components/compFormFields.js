// frontend/src/components/compFormFields.js

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  StyledForm,
  StyledFormGroup,
  StyledLabel,
  StyledInput,
  StyledSelect,
  StyledTextarea,
  StyledButton,
  StyledTitle,
} from './compStyles.js';

function FormFields({
  item,
  updateItem,
  handleSubmit,
  handleSaveDraft,
  handlePurchaseRecommendationChange,
}) {
  // Check if any form fields have been populated
  const isAnyFieldPopulated = useMemo(() => {
    return (
      item.name ||
      item.description ||
      item.category ||
      item.itemDetails?.type ||
      // Add checks for other fields here
      false
    );
  }, [item]);

  const renderAllFields = () => (
    <>
      {/* Input fields */}
      <StyledFormGroup>
        <StyledLabel htmlFor="name">Item Name</StyledLabel>
        <StyledInput
          type="text"
          id="name"
          value={item.name || ''}
          onChange={(e) => updateItem('name', e.target.value)}
          required
        />
      </StyledFormGroup>

      <StyledFormGroup>
        <StyledLabel htmlFor="description">Description</StyledLabel>
        <StyledTextarea
          id="description"
          value={item.description || ''}
          onChange={(e) => updateItem('description', e.target.value)}
          rows="3"
        />
      </StyledFormGroup>

      <StyledFormGroup>
        <StyledLabel htmlFor="category">Category</StyledLabel>
        <StyledInput
          type="text"
          id="category"
          value={item.category || ''}
          onChange={(e) => updateItem('category', e.target.value)}
        />
      </StyledFormGroup>

      <StyledFormGroup>
        <StyledLabel htmlFor="itemType">Item Type</StyledLabel>
        <StyledInput
          type="text"
          id="itemType"
          value={item.itemDetails?.type || ''}
          onChange={(e) => updateItem('itemDetails.type', e.target.value)}
          required
        />
      </StyledFormGroup>

      {/* ... (continue with all other input fields) ... */}

      {/* Analysis Fields */}
      <StyledTitle>Analysis Results</StyledTitle>

      {/* Item Details */}
      <StyledFormGroup>
        <StyledLabel htmlFor="itemType">Item Type</StyledLabel>
        <StyledInput
          type="text"
          id="itemType"
          value={item.itemDetails?.type || ''}
          onChange={(e) => updateItem('itemDetails.type', e.target.value)}
        />
      </StyledFormGroup>
      <StyledFormGroup>
        <StyledLabel htmlFor="itemBrand">Brand</StyledLabel>
        <StyledInput
          type="text"
          id="itemBrand"
          value={item.itemDetails?.brand || ''}
          onChange={(e) => updateItem('itemDetails.brand', e.target.value)}
        />
      </StyledFormGroup>
      <StyledFormGroup>
        <StyledLabel htmlFor="itemCondition">Condition</StyledLabel>
        <StyledInput
          type="text"
          id="itemCondition"
          value={item.itemDetails?.condition || ''}
          onChange={(e) => updateItem('itemDetails.condition', e.target.value)}
        />
      </StyledFormGroup>
      <StyledFormGroup>
        <StyledLabel htmlFor="itemRarity">Rarity</StyledLabel>
        <StyledInput
          type="text"
          id="itemRarity"
          value={item.itemDetails?.rarity || ''}
          onChange={(e) => updateItem('itemDetails.rarity', e.target.value)}
        />
      </StyledFormGroup>
      <StyledFormGroup>
        <StyledLabel htmlFor="itemAuthenticityConfirmed">
          Authenticity Confirmed
        </StyledLabel>
        <StyledSelect
          id="itemAuthenticityConfirmed"
          value={item.itemDetails?.authenticityConfirmed ? 'true' : 'false'}
          onChange={(e) =>
            updateItem(
              'itemDetails.authenticityConfirmed',
              e.target.value === 'true'
            )
          }
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </StyledSelect>
      </StyledFormGroup>

      {/* Financials */}
      <StyledFormGroup>
        <StyledLabel htmlFor="purchasePrice">Purchase Price</StyledLabel>
        <StyledInput
          type="number"
          id="purchasePrice"
          value={item.financials?.purchasePrice || ''}
          onChange={(e) =>
            updateItem('financials.purchasePrice', parseFloat(e.target.value))
          }
        />
      </StyledFormGroup>
      {/* Add similar fields for cleaningRepairCosts, estimatedShippingCosts, platformFees, expectedProfit, and estimatedValue */}

      {/* Market Analysis */}
      <StyledFormGroup>
        <StyledLabel htmlFor="marketDemand">Market Demand</StyledLabel>
        <StyledInput
          type="text"
          id="marketDemand"
          value={item.marketAnalysis?.marketDemand || ''}
          onChange={(e) =>
            updateItem('marketAnalysis.marketDemand', e.target.value)
          }
        />
      </StyledFormGroup>
      {/* Add similar fields for historicalPriceTrends, marketSaturation, and salesVelocity */}

      {/* Final Recommendation */}
      <StyledFormGroup>
        <StyledLabel htmlFor="purchaseRecommendation">
          Purchase Recommendation
        </StyledLabel>
        <StyledSelect
          id="purchaseRecommendation"
          value={
            item.finalRecommendation?.purchaseRecommendation?.toString() ||
            'Unknown'
          }
          onChange={(e) => handlePurchaseRecommendationChange(e.target.value)}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
          <option value="Unknown">Unknown</option>
        </StyledSelect>
      </StyledFormGroup>
      <StyledFormGroup>
        <StyledLabel htmlFor="detailedBreakdown">
          Detailed Breakdown
        </StyledLabel>
        <StyledTextarea
          id="detailedBreakdown"
          value={item.finalRecommendation?.detailedBreakdown || ''}
          onChange={(e) =>
            updateItem('finalRecommendation.detailedBreakdown', e.target.value)
          }
          rows="4"
        />
      </StyledFormGroup>
    </>
  );

  return (
    <>
      <StyledForm onSubmit={handleSubmit}>
        {isAnyFieldPopulated ? (
          <>
            {renderAllFields()}
            <StyledButton type="submit">Save Item</StyledButton>
          </>
        ) : (
          <StyledFormGroup>
            <StyledLabel htmlFor="name">Item Name</StyledLabel>
            <StyledInput
              type="text"
              id="name"
              value={item.name || ''}
              onChange={(e) => updateItem('name', e.target.value)}
              required
            />
          </StyledFormGroup>
        )}
      </StyledForm>

      {isAnyFieldPopulated && (
        <StyledButton onClick={handleSaveDraft}>Save Draft</StyledButton>
      )}
    </>
  );
}

FormFields.propTypes = {
  item: PropTypes.object.isRequired,
  updateItem: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleSaveDraft: PropTypes.func.isRequired,
  handlePurchaseRecommendationChange: PropTypes.func.isRequired,
};

export default FormFields;
