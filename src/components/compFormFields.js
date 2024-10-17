// frontend/src/components/compFormFields.js

import React, { useMemo, useEffect } from 'react';
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
  itemId, // Add this line
}) {
  const isAnyFieldPopulated = useMemo(() => {
    return Object.values(item).some(
      (value) => value !== null && value !== undefined && value !== ''
    );
  }, [item]);

  useEffect(() => {
    if (item.analysisResult) {
      // ... (keep existing analysis result handling)
    }
  }, [item.analysisResult, updateItem]);

  const renderField = (key, label, type = 'text') => (
    <StyledFormGroup key={key}>
      <StyledLabel htmlFor={key}>{label}</StyledLabel>
      {type === 'textarea' ? (
        <StyledTextarea
          id={key}
          value={item[key] || ''}
          onChange={(e) => updateItem(key, e.target.value)}
          rows="3"
        />
      ) : type === 'number' ? (
        <StyledInput
          type="number"
          id={key}
          value={item[key] || ''}
          onChange={(e) => updateItem(key, parseFloat(e.target.value))}
        />
      ) : type === 'date' ? (
        <StyledInput
          type="date"
          id={key}
          value={
            item[key] ? new Date(item[key]).toISOString().split('T')[0] : ''
          }
          onChange={(e) => updateItem(key, e.target.value)}
        />
      ) : type === 'boolean' ? (
        <StyledSelect
          id={key}
          value={item[key] === true ? 'true' : 'false'}
          onChange={(e) => updateItem(key, e.target.value === 'true')}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </StyledSelect>
      ) : (
        <StyledInput
          type={type}
          id={key}
          value={item[key] || ''}
          onChange={(e) => updateItem(key, e.target.value)}
        />
      )}
    </StyledFormGroup>
  );

  const renderAllFields = () => (
    <>
      <StyledTitle>Basic Item Information</StyledTitle>
      {renderField('itemId', 'Item ID')}
      {renderField('name', 'Item Name')}
      {renderField('brand', 'Brand')}
      {renderField('make', 'Make')}
      {renderField('model', 'Model')}
      {renderField('serialNumber', 'Serial Number')}
      {renderField('type', 'Type')}
      {renderField('description', 'Description', 'textarea')}
      {renderField('category', 'Category')}
      {renderField('subcategory', 'Subcategory')}
      {renderField('style', 'Style')}
      {renderField('vintage', 'Vintage', 'boolean')}
      {renderField('antique', 'Antique', 'boolean')}
      {renderField('rarity', 'Rarity')}
      {renderField(
        'packagingAccessoriesIncluded',
        'Packaging/Accessories Included'
      )}
      {renderField('materialComposition', 'Material Composition')}

      <StyledTitle>Clothing Measurements</StyledTitle>
      {renderField('clothingMeasurementsSizeLabel', 'Size Label')}
      {renderField('clothingMeasurementsChestBust', 'Chest/Bust')}
      {renderField('clothingMeasurementsWaist', 'Waist')}
      {renderField('clothingMeasurementsHips', 'Hips')}
      {renderField('clothingMeasurementsShoulderWidth', 'Shoulder Width')}
      {renderField('clothingMeasurementsSleeveLength', 'Sleeve Length')}
      {renderField('clothingMeasurementsInseam', 'Inseam')}
      {renderField('clothingMeasurementsTotalLength', 'Total Length')}

      <StyledTitle>Footwear Measurements</StyledTitle>
      {renderField('footwearMeasurementsSize', 'Size')}
      {renderField('footwearMeasurementsWidth', 'Width')}
      {renderField('footwearMeasurementsInsoleLength', 'Insole Length')}
      {renderField('footwearMeasurementsHeelHeight', 'Heel Height')}
      {renderField('footwearMeasurementsPlatformHeight', 'Platform Height')}
      {renderField('footwearMeasurementsBootShaftHeight', 'Boot Shaft Height')}
      {renderField(
        'footwearMeasurementsCalfCircumference',
        'Calf Circumference'
      )}

      <StyledTitle>Jewelry Measurements</StyledTitle>
      {renderField('jewelryMeasurementsRingSize', 'Ring Size')}
      {renderField(
        'jewelryMeasurementsNecklaceBraceletLength',
        'Necklace/Bracelet Length'
      )}
      {renderField(
        'jewelryMeasurementsPendantDimensions',
        'Pendant Dimensions'
      )}
      {renderField(
        'jewelryMeasurementsJewelryDimensions',
        'Jewelry Dimensions'
      )}

      <StyledTitle>Furniture and Large Item Measurements</StyledTitle>
      {renderField('furnitureLargeItemMeasurementsHeight', 'Height')}
      {renderField('furnitureLargeItemMeasurementsWidth', 'Width')}
      {renderField('furnitureLargeItemMeasurementsDepth', 'Depth')}
      {renderField('furnitureLargeItemMeasurementsLength', 'Length')}
      {renderField('furnitureLargeItemMeasurementsSeatHeight', 'Seat Height')}
      {renderField(
        'furnitureLargeItemMeasurementsTabletopDimensions',
        'Tabletop Dimensions'
      )}

      <StyledTitle>General Measurements</StyledTitle>
      {renderField('generalMeasurementsWeight', 'Weight')}
      {renderField('generalMeasurementsDiameter', 'Diameter')}
      {renderField('generalMeasurementsVolumeCapacity', 'Volume/Capacity')}
      {renderField(
        'generalMeasurementsOtherSpecificMeasurements',
        'Other Specific Measurements'
      )}

      <StyledTitle>Condition</StyledTitle>
      {renderField('conditionRating', 'Condition Rating')}
      {renderField('conditionSignsOfWear', 'Signs of Wear')}
      {renderField('conditionDetailedNotes', 'Detailed Notes', 'textarea')}
      {renderField('conditionRepairNeeds', 'Repair Needs')}
      {renderField('conditionCleaningRequirements', 'Cleaning Requirements')}
      {renderField(
        'conditionEstimatedRepairCosts',
        'Estimated Repair Costs',
        'number'
      )}
      {renderField(
        'conditionEstimatedCleaningCosts',
        'Estimated Cleaning Costs',
        'number'
      )}
      {renderField(
        'conditionTimeSpentOnRepairsCleaning',
        'Time Spent on Repairs/Cleaning'
      )}

      <StyledTitle>Financials</StyledTitle>
      {renderField('financialsPurchasePrice', 'Purchase Price', 'number')}
      {renderField(
        'financialsTotalRepairAndCleaningCosts',
        'Total Repair and Cleaning Costs',
        'number'
      )}
      {renderField(
        'financialsEstimatedShippingCosts',
        'Estimated Shipping Costs',
        'number'
      )}
      {renderField('financialsPlatformFees', 'Platform Fees', 'number')}
      {renderField('financialsExpectedProfit', 'Expected Profit', 'number')}
      {renderField('financialsProfitMargin', 'Profit Margin', 'number')}
      {renderField(
        'financialsEstimatedMarketValue',
        'Estimated Market Value',
        'number'
      )}
      {renderField('financialsAcquisitionCost', 'Acquisition Cost', 'number')}

      <StyledTitle>Market Analysis</StyledTitle>
      {renderField('marketAnalysisMarketDemand', 'Market Demand')}
      {renderField(
        'marketAnalysisHistoricalPriceTrends',
        'Historical Price Trends'
      )}
      {renderField('marketAnalysisMarketSaturation', 'Market Saturation')}
      {renderField('marketAnalysisSalesVelocity', 'Sales Velocity')}
      {renderField(
        'marketAnalysisSuggestedListingPrice',
        'Suggested Listing Price',
        'number'
      )}
      {renderField(
        'marketAnalysisMinimumAcceptablePrice',
        'Minimum Acceptable Price',
        'number'
      )}

      <StyledTitle>Additional Information</StyledTitle>
      {renderField(
        'itemCareInstructions',
        'Item Care Instructions',
        'textarea'
      )}
      {renderField('keywordsForSeo', 'Keywords for SEO', 'textarea')}
      {renderField('lotOrBundleInformation', 'Lot or Bundle Information')}
      {renderField('customizableFields', 'Customizable Fields')}
      {renderField('recommendedSalePlatforms', 'Recommended Sale Platforms')}

      <StyledTitle>Compliance</StyledTitle>
      {renderField('compliancePlatformPolicies', 'Platform Policies')}
      {renderField('complianceAuthenticityMarkers', 'Authenticity Markers')}
      {renderField('complianceCounterfeitRisk', 'Counterfeit Risk')}
      {renderField('complianceStatus', 'Compliance Status')}
      {renderField('complianceRestrictedItemCheck', 'Restricted Item Check')}

      <StyledTitle>Inventory Details</StyledTitle>
      {renderField('inventoryDetailsInventoryId', 'Inventory ID')}
      {renderField('inventoryDetailsStorageLocation', 'Storage Location')}
      {renderField(
        'inventoryDetailsAcquisitionDate',
        'Acquisition Date',
        'date'
      )}
      {renderField('inventoryDetailsTargetMarket', 'Target Market')}
      {renderField('inventoryDetailsTrendingItems', 'Trending Items')}
      {renderField(
        'inventoryDetailsCustomerPreferences',
        'Customer Preferences'
      )}
      {renderField(
        'inventoryDetailsAcquisitionLocation',
        'Acquisition Location'
      )}
      {renderField(
        'inventoryDetailsSupplierInformation',
        'Supplier Information'
      )}

      <StyledTitle>Dates</StyledTitle>
      {renderField('purchaseDate', 'Purchase Date', 'date')}
      {renderField('listingDate', 'Listing Date', 'date')}

      <StyledTitle>Additional Notes</StyledTitle>
      {renderField('sellerNotes', 'Seller Notes', 'textarea')}
      {renderField('contextData', 'Context Data', 'textarea')}

      <StyledTitle>Final Recommendation</StyledTitle>
      <StyledFormGroup>
        <StyledLabel htmlFor="purchaseRecommendation">
          Purchase Recommendation
        </StyledLabel>
        <StyledSelect
          id="purchaseRecommendation"
          value={item.purchaseRecommendation || 'Unknown'}
          onChange={(e) => handlePurchaseRecommendationChange(e.target.value)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Unknown">Unknown</option>
        </StyledSelect>
      </StyledFormGroup>
      {renderField('detailedBreakdown', 'Detailed Breakdown', 'textarea')}
      {renderField(
        'sampleForSaleListing',
        'Sample For Sale Listing',
        'textarea'
      )}
    </>
  );

  // You can now use itemId within your component if needed
  // For example, you might want to use it in the form submission:
  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(itemId);
  };

  return (
    <>
      <StyledForm onSubmit={onSubmit}>
        {isAnyFieldPopulated ? (
          <>
            {renderAllFields()}
            <StyledButton type="submit">Purchase Item</StyledButton>
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
        <StyledButton onClick={() => handleSaveDraft(itemId)}>
          Save Draft
        </StyledButton>
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
  itemId: PropTypes.string.isRequired,
};

export default FormFields;
