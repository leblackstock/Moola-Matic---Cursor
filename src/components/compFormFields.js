// frontend/src/components/compFormFields.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  analysisResult,
  aiRecommendation,
}) {
  const [hasPopulatedFields, setHasPopulatedFields] = useState(false);
  const previousAnalysisResultRef = useRef();

  // Debounce the save function to avoid too frequent saves
  const debouncedSave = useCallback(
    _.debounce((newItem) => {
      handleSaveDraft(itemId, newItem);
    }, 1000),
    [handleSaveDraft, itemId]
  );

  useEffect(() => {
    if (
      analysisResult &&
      analysisResult !== previousAnalysisResultRef.current
    ) {
      console.log('FormFields received new analysisResult:', analysisResult);
      previousAnalysisResultRef.current = analysisResult;

      if (analysisResult.summary) {
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
          if (
            summary.finalRecommendation.purchaseRecommendation !== undefined
          ) {
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
        console.log('No valid summary available in the analysisResult');
      }
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

  const renderField = (key, label, type = 'text') => {
    const value = item[key];
    if (value === null || value === undefined || value === '') return null;

    return (
      <StyledFormGroup key={key}>
        <StyledLabel htmlFor={key}>{label}</StyledLabel>
        {type === 'textarea' ? (
          <StyledTextarea
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            rows="3"
          />
        ) : type === 'number' ? (
          <StyledInput
            type="number"
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
          />
        ) : type === 'date' ? (
          <StyledInput
            type="date"
            id={key}
            value={
              value instanceof Date ? value.toISOString().split('T')[0] : value
            }
            onChange={(e) => handleFieldChange(key, e.target.value)}
          />
        ) : type === 'boolean' ? (
          <StyledSelect
            id={key}
            value={value.toString()}
            onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </StyledSelect>
        ) : (
          <StyledInput
            type={type}
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
          />
        )}
      </StyledFormGroup>
    );
  };

  const renderFieldGroup = (title, fields) => {
    const renderedFields = fields
      .map(([key, label, type]) => renderField(key, label, type))
      .filter(Boolean);
    if (renderedFields.length === 0) return null;
    return (
      <>
        <StyledTitle>{title}</StyledTitle>
        {renderedFields}
      </>
    );
  };

  const renderAllFields = () => {
    const fieldGroups = [
      [
        'Basic Item Information',
        [
          ['name', 'Item Name'],
          ['brand', 'Brand'],
          ['make', 'Make'],
          ['model', 'Model'],
          ['serialNumber', 'Serial Number'],
          ['type', 'Type'],
          ['description', 'Description', 'textarea'],
          ['category', 'Category'],
          ['subcategory', 'Subcategory'],
          ['style', 'Style'],
          ['vintage', 'Vintage', 'boolean'],
          ['antique', 'Antique', 'boolean'],
          ['rarity', 'Rarity'],
          ['packagingAccessoriesIncluded', 'Packaging/Accessories Included'],
          ['materialComposition', 'Material Composition'],
        ],
      ],
      [
        'Clothing Measurements',
        [
          ['clothingMeasurementsSizeLabel', 'Size Label'],
          ['clothingMeasurementsChestBust', 'Chest/Bust'],
          ['clothingMeasurementsWaist', 'Waist'],
          ['clothingMeasurementsHips', 'Hips'],
          ['clothingMeasurementsShoulderWidth', 'Shoulder Width'],
          ['clothingMeasurementsSleeveLength', 'Sleeve Length'],
          ['clothingMeasurementsInseam', 'Inseam'],
          ['clothingMeasurementsTotalLength', 'Total Length'],
        ],
      ],
      [
        'Footwear Measurements',
        [
          ['footwearMeasurementsSize', 'Size'],
          ['footwearMeasurementsWidth', 'Width'],
          ['footwearMeasurementsInsoleLength', 'Insole Length'],
          ['footwearMeasurementsHeelHeight', 'Heel Height'],
          ['footwearMeasurementsPlatformHeight', 'Platform Height'],
          ['footwearMeasurementsBootShaftHeight', 'Boot Shaft Height'],
          ['footwearMeasurementsCalfCircumference', 'Calf Circumference'],
        ],
      ],
      [
        'Jewelry Measurements',
        [
          ['jewelryMeasurementsRingSize', 'Ring Size'],
          [
            'jewelryMeasurementsNecklaceBraceletLength',
            'Necklace/Bracelet Length',
          ],
          ['jewelryMeasurementsPendantDimensions', 'Pendant Dimensions'],
          ['jewelryMeasurementsJewelryDimensions', 'Jewelry Dimensions'],
        ],
      ],
      [
        'Furniture and Large Item Measurements',
        [
          ['furnitureLargeItemMeasurementsHeight', 'Height'],
          ['furnitureLargeItemMeasurementsWidth', 'Width'],
          ['furnitureLargeItemMeasurementsDepth', 'Depth'],
          ['furnitureLargeItemMeasurementsLength', 'Length'],
          ['furnitureLargeItemMeasurementsSeatHeight', 'Seat Height'],
          [
            'furnitureLargeItemMeasurementsTabletopDimensions',
            'Tabletop Dimensions',
          ],
        ],
      ],
      [
        'General Measurements',
        [
          ['generalMeasurementsWeight', 'Weight'],
          ['generalMeasurementsDiameter', 'Diameter'],
          ['generalMeasurementsVolumeCapacity', 'Volume/Capacity'],
          [
            'generalMeasurementsOtherSpecificMeasurements',
            'Other Specific Measurements',
          ],
        ],
      ],
      [
        'Condition',
        [
          ['conditionRating', 'Condition Rating'],
          ['conditionSignsOfWear', 'Signs of Wear'],
          ['conditionDetailedNotes', 'Detailed Notes', 'textarea'],
          ['conditionRepairNeeds', 'Repair Needs'],
          ['conditionCleaningRequirements', 'Cleaning Requirements'],
          ['conditionEstimatedRepairCosts', 'Estimated Repair Costs', 'number'],
          [
            'conditionEstimatedCleaningCosts',
            'Estimated Cleaning Costs',
            'number',
          ],
          [
            'conditionTimeSpentOnRepairsCleaning',
            'Time Spent on Repairs/Cleaning',
          ],
        ],
      ],
      [
        'Financials',
        [
          ['financialsPurchasePrice', 'Purchase Price', 'number'],
          [
            'financialsTotalRepairAndCleaningCosts',
            'Total Repair and Cleaning Costs',
            'number',
          ],
          [
            'financialsEstimatedShippingCosts',
            'Estimated Shipping Costs',
            'number',
          ],
          ['financialsPlatformFees', 'Platform Fees', 'number'],
          ['financialsExpectedProfit', 'Expected Profit', 'number'],
          ['financialsProfitMargin', 'Profit Margin', 'number'],
          [
            'financialsEstimatedMarketValue',
            'Estimated Market Value',
            'number',
          ],
          ['financialsAcquisitionCost', 'Acquisition Cost', 'number'],
        ],
      ],
      [
        'Market Analysis',
        [
          ['marketAnalysisMarketDemand', 'Market Demand'],
          ['marketAnalysisHistoricalPriceTrends', 'Historical Price Trends'],
          ['marketAnalysisMarketSaturation', 'Market Saturation'],
          ['marketAnalysisSalesVelocity', 'Sales Velocity'],
          [
            'marketAnalysisSuggestedListingPrice',
            'Suggested Listing Price',
            'number',
          ],
          [
            'marketAnalysisMinimumAcceptablePrice',
            'Minimum Acceptable Price',
            'number',
          ],
        ],
      ],
      [
        'Additional Information',
        [
          ['itemCareInstructions', 'Item Care Instructions', 'textarea'],
          ['keywordsForSeo', 'Keywords for SEO', 'textarea'],
          ['lotOrBundleInformation', 'Lot or Bundle Information'],
          ['customizableFields', 'Customizable Fields'],
          ['recommendedSalePlatforms', 'Recommended Sale Platforms'],
        ],
      ],
      [
        'Compliance',
        [
          ['compliancePlatformPolicies', 'Platform Policies'],
          ['complianceAuthenticityMarkers', 'Authenticity Markers'],
          ['complianceCounterfeitRisk', 'Counterfeit Risk'],
          ['complianceStatus', 'Compliance Status'],
          ['complianceRestrictedItemCheck', 'Restricted Item Check'],
        ],
      ],
      [
        'Inventory Details',
        [
          ['inventoryDetailsInventoryId', 'Inventory ID'],
          ['inventoryDetailsStorageLocation', 'Storage Location'],
          ['inventoryDetailsAcquisitionDate', 'Acquisition Date', 'date'],
          ['inventoryDetailsTargetMarket', 'Target Market'],
          ['inventoryDetailsTrendingItems', 'Trending Items'],
          ['inventoryDetailsCustomerPreferences', 'Customer Preferences'],
          ['inventoryDetailsAcquisitionLocation', 'Acquisition Location'],
          ['inventoryDetailsSupplierInformation', 'Supplier Information'],
        ],
      ],
      [
        'Dates',
        [
          ['purchaseDate', 'Purchase Date', 'date'],
          ['listingDate', 'Listing Date', 'date'],
        ],
      ],
      [
        'Additional Notes',
        [
          ['sellerNotes', 'Seller Notes', 'textarea'],
          ['contextData', 'Context Data', 'textarea'],
        ],
      ],
      [
        'Final Recommendation',
        [
          ['detailedBreakdown', 'Detailed Breakdown', 'textarea'],
          ['sampleForSaleListing', 'Sample For Sale Listing', 'textarea'],
        ],
      ],
    ];

    const renderedGroups = fieldGroups
      .map(([title, fields]) => renderFieldGroup(title, fields))
      .filter(Boolean);

    useEffect(() => {
      setHasPopulatedFields(renderedGroups.length > 0);
    }, [renderedGroups.length]);

    return renderedGroups;
  };

  const renderPurchaseRecommendation = () => {
    if (
      !item.purchaseRecommendation ||
      item.purchaseRecommendation === 'Unknown'
    )
      return null;
    return (
      <StyledFormGroup>
        <StyledLabel htmlFor="purchaseRecommendation">
          Purchase Recommendation
        </StyledLabel>
        <StyledSelect
          id="purchaseRecommendation"
          value={item.purchaseRecommendation}
          onChange={(e) => handlePurchaseRecommendationChange(e.target.value)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Unknown">Unknown</option>
        </StyledSelect>
      </StyledFormGroup>
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(itemId);
  };

  return (
    <>
      <StyledForm onSubmit={onSubmit}>
        {renderAllFields()}
        {renderPurchaseRecommendation()}
        {hasPopulatedFields && (
          <>
            <StyledButton type="submit">Purchase Item</StyledButton>
            <StyledButton onClick={() => handleSaveDraft(itemId, item)}>
              Save Draft
            </StyledButton>
          </>
        )}
      </StyledForm>
      <StyledFormGroup>
        <StyledLabel>Item ID</StyledLabel>
        <div>{itemId || 'Not assigned yet'}</div>
      </StyledFormGroup>
      <div>
        <label>AI Recommendation:</label>
        <p>
          {aiRecommendation?.purchaseRecommendation !== undefined
            ? `Purchase Recommendation: ${aiRecommendation.purchaseRecommendation ? 'Yes' : 'No'}`
            : 'No recommendation available'}
        </p>
        {aiRecommendation?.explanation && (
          <p>Explanation: {aiRecommendation.explanation}</p>
        )}
      </div>
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
  analysisResult: PropTypes.object,
  aiRecommendation: PropTypes.object,
};

export default FormFields;
