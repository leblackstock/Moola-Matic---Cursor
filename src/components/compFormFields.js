// frontend/src/components/compFormFields.js

import React, { useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash'; // Import the full lodash library
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
  itemId,
  analysisResult, // Add this prop
}) {
  const isAnyFieldPopulated = useMemo(() => {
    return Object.values(item).some(
      (value) => value !== null && value !== undefined && value !== ''
    );
  }, [item]);

  // Debounce the save function to avoid too frequent saves
  const debouncedSave = useCallback(
    _.debounce((newItem) => {
      handleSaveDraft(itemId, newItem);
    }, 1000),
    [handleSaveDraft, itemId]
  );

  useEffect(() => {
    console.log('FormFields received new analysisResult:', analysisResult);

    if (analysisResult && analysisResult.summary) {
      console.log('Processing summary:', analysisResult.summary);

      const { summary } = analysisResult;

      // Update form fields based on the analysis result
      if (summary.itemDetails) {
        console.log('Updating item details:', summary.itemDetails);
        Object.entries(summary.itemDetails).forEach(([key, value]) => {
          if (value !== undefined) {
            console.log(`Updating ${key} to ${value}`);
            updateItem(key, value);
          }
        });
      }

      if (summary.financials) {
        Object.entries(summary.financials).forEach(([key, value]) => {
          if (value !== undefined) {
            updateItem(
              `financials${key.charAt(0).toUpperCase() + key.slice(1)}`,
              value
            );
          }
        });
      }

      if (summary.marketAnalysis) {
        Object.entries(summary.marketAnalysis).forEach(([key, value]) => {
          if (value !== undefined) {
            updateItem(
              `marketAnalysis${key.charAt(0).toUpperCase() + key.slice(1)}`,
              value
            );
          }
        });
      }

      if (summary.condition) {
        Object.entries(summary.condition).forEach(([key, value]) => {
          if (value !== undefined) {
            updateItem(
              `condition${key.charAt(0).toUpperCase() + key.slice(1)}`,
              value
            );
          }
        });
      }

      if (summary.measurements) {
        Object.entries(summary.measurements).forEach(
          ([category, measurements]) => {
            if (typeof measurements === 'object') {
              Object.entries(measurements).forEach(([key, value]) => {
                if (value !== undefined) {
                  updateItem(
                    `${category}${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    value
                  );
                }
              });
            }
          }
        );
      }

      if (summary.compliance) {
        Object.entries(summary.compliance).forEach(([key, value]) => {
          if (value !== undefined) {
            updateItem(
              `compliance${key.charAt(0).toUpperCase() + key.slice(1)}`,
              value
            );
          }
        });
      }

      if (summary.additionalInfo) {
        Object.entries(summary.additionalInfo).forEach(([key, value]) => {
          if (value !== undefined) {
            updateItem(key, value);
          }
        });
      }

      if (summary.finalRecommendation) {
        console.log(
          'Updating final recommendation:',
          summary.finalRecommendation
        );
        if (summary.finalRecommendation.purchaseRecommendation !== undefined) {
          console.log(
            `Updating purchaseRecommendation to ${summary.finalRecommendation.purchaseRecommendation}`
          );
          updateItem(
            'purchaseRecommendation',
            summary.finalRecommendation.purchaseRecommendation
          );
        }
        if (summary.finalRecommendation.detailedBreakdown !== undefined) {
          console.log(`Updating detailedBreakdown`);
          updateItem(
            'detailedBreakdown',
            summary.finalRecommendation.detailedBreakdown
          );
        }
      }
    } else {
      console.log('No valid analysisResult or summary available');
    }
  }, [analysisResult, updateItem]);

  const handleFieldChange = useCallback(
    (key, value) => {
      const newItem = { ...item, [key]: value };
      updateItem(key, value);
      debouncedSave(newItem);
    },
    [item, updateItem, debouncedSave]
  );

  const renderField = (key, label, type = 'text') => (
    <StyledFormGroup key={key}>
      <StyledLabel htmlFor={key}>{label}</StyledLabel>
      {type === 'textarea' ? (
        <StyledTextarea
          id={key}
          value={item[key] || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
          rows="3"
        />
      ) : type === 'number' ? (
        <StyledInput
          type="number"
          id={key}
          value={item[key] || ''}
          onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
        />
      ) : type === 'date' ? (
        <StyledInput
          type="date"
          id={key}
          value={
            item[key] ? new Date(item[key]).toISOString().split('T')[0] : ''
          }
          onChange={(e) => handleFieldChange(key, e.target.value)}
        />
      ) : type === 'boolean' ? (
        <StyledSelect
          id={key}
          value={item[key] === true ? 'true' : 'false'}
          onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </StyledSelect>
      ) : (
        <StyledInput
          type={type}
          id={key}
          value={item[key] || ''}
          onChange={(e) => handleFieldChange(key, e.target.value)}
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
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
            />
          </StyledFormGroup>
        )}
      </StyledForm>

      {isAnyFieldPopulated && (
        <StyledButton onClick={() => handleSaveDraft(itemId, item)}>
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
  analysisResult: PropTypes.object, // Add this prop type
};

export default FormFields;
