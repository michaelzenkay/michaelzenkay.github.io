window.PORTFOLIO={
  "mammo": {
    "name": "Mammography-Based Breast Cancer Risk Prediction",
    "eyebrow": "Research / Mammography",
    "description": "Four-view mammography, cross-view attention, and time-to-event modeling for future breast cancer risk.",
    "image": "mammo-results.svg",
    "research": {
      "rows": [
        {
          "years": 1,
          "eligible_exams": 837,
          "positive_exams": 87,
          "negative_exams": 750,
          "historical_auc": 0.746
        },
        {
          "years": 2,
          "eligible_exams": 491,
          "positive_exams": 112,
          "negative_exams": 379,
          "historical_auc": 0.817
        },
        {
          "years": 3,
          "eligible_exams": 353,
          "positive_exams": 131,
          "negative_exams": 222,
          "historical_auc": 0.807
        },
        {
          "years": 4,
          "eligible_exams": 243,
          "positive_exams": 137,
          "negative_exams": 106,
          "historical_auc": 0.802
        }
      ],
      "reportSha256": "c85313ce1bcfe97d1e4ca2ac41ba4b85d258fe7ddc1aa308aa7af9a0f5607463"
    },
    "summary": "Learn an exam-level representation from routine screening mammograms and predict cumulative cancer risk over multiple follow-up horizons.",
    "metric": "1y 0.746 / 2y 0.817 / 3y 0.807 / 4y 0.802",
    "metricLabel": "Internal-validation AUC by horizon",
    "metricNote": "Each horizon includes only exams with enough follow-up to be labeled.",
    "stack": [
      "Four-view mammography",
      "EfficientNetV2S + transformer",
      "Discrete-time survival"
    ],
    "methods": "A shared image encoder processes the four standard mammography views. A transformer combines their features into an exam representation, and a discrete-time survival head estimates cumulative risk.",
    "pipeline": [
      "LCC, LMLO, RCC and RMLO mammograms",
      "Shared grayscale EfficientNetV2S encoder",
      "View embeddings + transformer aggregation",
      "Five hazard outputs → cumulative risk"
    ],
    "methodDetails": [
      {
        "title": "Inputs and model",
        "text": "A shared, ImageNet-initialized EfficientNetV2S encodes LCC, LMLO, RCC and RMLO images into 1,280 features per view. View-type embeddings identify side and projection. A two-layer, eight-head transformer combines the views through a learned CLS token to form the exam representation."
      },
      {
        "title": "Training curriculum",
        "text": "Training starts with image-level auxiliary tasks, including acquisition metadata and cancer status. It then gradually increases exam-level risk supervision while tapering auxiliary losses. Follow-up eligibility determines which risk targets contribute; shorter-follow-up exams can still support auxiliary learning."
      },
      {
        "title": "Follow-up and risk",
        "text": "Five hazard probabilities produce cumulative risk through each horizon as one minus the product of survival probabilities up to that horizon. A cancer-free label requires sufficient follow-up; an observed diagnosis establishes positive labels from the corresponding horizon onward."
      },
      {
        "title": "Evaluation",
        "text": "The training report describes internal validation on patients held out from training. AUC is reported for each horizon with its positive and negative exam counts. The results shown here come from that report and were not recomputed from the current source."
      }
    ],
    "watch": "The horizon table shows how many validation exams had enough follow-up for each horizon. The counts shrink as the horizon lengthens.",
    "evidence": "Internal validation on held-out patients gave AUCs of 0.746, 0.817, 0.807 and 0.802 at years 1 to 4, as recorded in the training report. On the same validation fold, mean AUC across years 1 to 4 was 0.203 higher than the public Mirai reference model run with PR16 weights.",
    "limits": "These results come from the retained training report. The original imaging data and matched predictions are no longer accessible, so the results cannot be re-audited and have no confidence intervals. The Mirai comparison ran Mirai as an image-only baseline, without the clinical covariates it can use, so covariate-inclusive deployments may perform differently. External validation, calibration and clinical utility have not been established.",
    "code": "https://github.com/michaelzenkay/mg-public",
    "codeStatus": "Public source: mg-public",
    "sourceNote": "The linked source includes the image encoder, cross-view transformer, staged trainer and horizon-specific evaluation. Reproducing a checkpoint requires its matching architecture and weights.",
    "sourceFiles": [],
    "references": [
      [
        "Historical manuscript and aggregate results",
        "../reports/mg_manuscript_latest.html"
      ],
      [
        "Detailed training report",
        "../reports/mg_best_report.html"
      ]
    ],
    "mode": "Reported results",
    "modeDetail": "Aggregate results from the training report, with exam counts for each horizon.",
    "reference": "Follow-up cancer outcomes",
    "referenceDetail": "Cancer diagnoses during follow-up. Training and validation patients were kept separate.",
    "shortLimit": "Five-year AUC is excluded: that subset had only one negative exam.",
    "try": "Discrimination across the first four prediction horizons, alongside the exams eligible for each evaluation.",
    "context": "The cohort included 42,987 complete four-view examinations from 33,488 patients. This page covers the model architecture, the training curriculum and the internal-validation results.",
    "methodsTitle": "Four views to cumulative risk",
    "materials": [
      {
        "label": "Manuscript draft",
        "url": "../reports/mg_manuscript_latest.html",
        "detail": "Historical manuscript: cohort, architecture, methods and reported results."
      },
      {
        "label": "Training report",
        "url": "../reports/mg_best_report.html",
        "detail": "Detailed model, training configuration, learning curves and evaluation plots."
      }
    ]
  },
  "tumor": {
    "name": "Interactive Breast MRI Tumor Segmentation",
    "eyebrow": "01 / Breast MRI",
    "description": "A 3D U-Net for tumor segmentation in dynamic contrast-enhanced breast MRI from the I-SPY1 dataset.",
    "image": "/figures/tumor-seg-preview-crop.png",
    "try": "Explore five cases, from a compact lesion to complex multifocal disease. Read the case notes, compare Prediction with Training label, then place a seed to try a local segmentation.",
    "methods": "Three aligned contrast phases feed a 3D U-Net. The demo combines saved whole-volume predictions with image-placed seed inference and physical measurements of the resulting masks.",
    "evidence": "The demo uses the U-Net from a recovered joint segmentation and pCR model and shows only its segmentation output. Re-running the original evaluation reproduced a Dice of 0.7405, pooled across batches on the cohort used for checkpoint selection, with 1 mm resampling and image-centered crops.",
    "limits": "The reference contours are my own non-expert annotations of the primary tumor, drawn in ITK-SNAP, and are not expert ground truth. The Dice score comes from the validation split that also selected the checkpoint, with no separate test set, and it does not measure performance from arbitrary seeds or on full volumes. Live inference runs on the native image grid, while training and evaluation used 1 mm resampling.",
    "code": "https://github.com/michaelzenkay/breast-mri-public",
    "codeStatus": "Public source: breast-mri-public",
    "pipeline": [
      "Three aligned MRI phases",
      "3D U-Net tumor prediction",
      "Full-volume masks and measurements",
      "Image-placed seed for live segmentation"
    ],
    "mode": "Live inference",
    "modeDetail": "The seed runs the model. The saved mask and training annotation are separate overlays.",
    "summary": "I-SPY1 contains breast MRI examinations of patients with breast cancer. This project uses pre-contrast, early post-contrast and later post-contrast images to predict the primary tumor. The viewer combines these three phases as RGB dynamics, making differences in contrast enhancement visible in color.",
    "watch": "The case notes point out what the model captures, where the original annotation may be incomplete, and where thin boundaries remain difficult. They are my own visual review.",
    "metric": "0.7405",
    "metricLabel": "Validation Dice",
    "metricNote": "Pooled across batches on the checkpoint-selection cohort.",
    "reference": "Non-expert training annotation",
    "referenceDetail": "My ITK-SNAP contour of the primary tumor, shown for comparison.",
    "shortLimit": "Five cases. The training annotations are non-expert.",
    "stack": [
      "I-SPY1 breast MRI",
      "Three contrast phases",
      "3D U-Net"
    ],
    "references": [],
    "methodDetails": [
      {
        "title": "Inputs and display",
        "text": "Pre-contrast, early post-contrast and later post-contrast volumes are clipped, scaled and z-scored independently for the network. The RGB display is for viewing and does not change the network input. Uptake and washout analysis would need the original signal values and verified acquisition times, so this demo leaves it out."
      },
      {
        "title": "Model and inference",
        "text": "A three-channel 3D U-Net produces tumor probabilities, thresholded at >0.5. Saved examples use complete volumes resampled to 1 mm in a single pass. Live inference evaluates a 96 x 96 x 96 voxel crop around the image-placed seed on the native grid. Its physical size depends on voxel spacing; tissue outside that crop is unevaluated."
      },
      {
        "title": "Mask measurements",
        "text": "Foreground voxel count and spacing give tumor volume. Physical mask coordinates define three PCA-axis extents, and the estimated surface gives sphericity. These measurements are calculated from each predicted mask and inherit its errors. The training annotation is a comparison overlay only; inference does not use it."
      },
      {
        "title": "Current training and evaluation",
        "text": "The source provides a segmentation-only trainer using BCE plus soft Dice, Adam and cosine learning-rate decay. Inputs are resampled to 1 mm and cropped/padded at the image center; training adds flips, affine transforms and noise. Patient IDs cannot cross splits. Checkpoint selection uses mean per-case Dice. The demo checkpoint and its score are described under Evidence."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The breast-mri-public repository includes the 3D U-Net, preprocessing, whole-volume and seed inference, mask measurements, and segmentation-only training and evaluation. It loads the demo's segmentation weights, but its trainer does not reproduce the joint pCR training.",
    "context": "The five examinations range from a compact focal lesion to broad multifocal disease, and in one case the prediction extends past the original label. Compare the saved full-volume predictions with the training contours, then place a seed to segment a local region with the same 3D U-Net.",
    "methodsTitle": "Breast MRI segmentation"
  },
  "heart": {
    "name": "Cardiac 4D Flow MRI Analysis",
    "eyebrow": "02 / Cardiac MRI",
    "description": "Locating the aorta and measuring blood flow through the heartbeat using simulated MRI.",
    "image": "/portfolio/heart-preview.png",
    "try": "Choose a case, move through the heartbeat, and compare the predicted vessel outline, cross-sectional area and flow with the supplied reference mask.",
    "methods": "The analysis follows four steps: calculate blood velocity, segment the aorta, place measurement planes, and measure flow at each point in the heartbeat.",
    "evidence": "All 30 development series were processed, and 28 passed numerical geometry checks. The portfolio shows the three series with the largest share of plane-frames under 10% area error, plus one clear failure.",
    "limits": "No series meets the strict criterion of under 10% area error on every plane and frame. The examples include training data and repeated subjects, and passing the geometry checks does not establish flow accuracy or independent validation.",
    "code": "https://github.com/michaelzenkay/heart-public",
    "codeStatus": "Public source: heart-public",
    "pipeline": [
      "Calculate velocity from MRI phase",
      "Locate the aorta with a 3D U-Net",
      "Fit a centerline and measurement planes",
      "Measure vessel area and blood flow"
    ],
    "mode": "Saved model outputs",
    "modeDetail": "Changing the frame or plane steps through saved predictions and measurements.",
    "summary": "RACLETTE is a simulated MRI dataset for studying blood flow through the aorta, the main artery leaving the heart. Computer simulations of blood flow are combined with an MRI signal model to produce realistic images with known vessel boundaries and reference flow data.",
    "watch": "",
    "metric": "28 / 30",
    "metricLabel": "Series passing geometry checks",
    "metricNote": "Development series, including repeated subjects; this is not a flow-accuracy score.",
    "reference": "Supplied mask, same plane",
    "referenceDetail": "Both masks use the same CNN plane and phase-derived velocity, so differences come from the masks alone.",
    "shortLimit": "",
    "stack": [],
    "references": [
      [
        "RACLETTE dataset - Dirix, Buoso and Kozerke (2026)",
        "https://doi.org/10.3929/ethz-c-000799752"
      ],
      [
        "Dataset documentation and simulation method",
        "https://github.com/rfuentes89/RACLETTE"
      ],
      [
        "Dataset license: CC BY-NC 4.0",
        "https://creativecommons.org/licenses/by-nc/4.0/"
      ]
    ],
    "methodDetails": [
      {
        "title": "1. Calculate blood velocity",
        "text": "MRI records both signal brightness (magnitude) and signal angle (phase). In velocity-encoded images, moving blood changes the phase. Comparing each encoded signal with an unencoded reference removes the common phase offset; the known encoding strength converts that difference to velocity along the encoding direction.\n\nI combine measurements from several directions to estimate the blood's three-dimensional motion. A least-squares fit finds the three velocity components that best match those measurements."
      },
      {
        "title": "2. Segment the aorta",
        "text": "A 3D U-Net receives four inputs: the magnitude image and the three velocity maps, resampled to a 3 mm grid. It predicts the probability that each voxel belongs to the aorta; probabilities above 50% form the vessel mask. Each cardiac frame is processed separately.\n\nTraining combines voxel classification and mask-overlap losses (BCE and Dice). Related anatomies and image backgrounds stay in the same data split, and the checkpoint is selected using grouped validation Dice."
      },
      {
        "title": "3. Place measurement planes",
        "text": "Points farthest from the vessel boundary trace a route through its middle. I fit a smooth curve, or spline, along that route and place 36 planes perpendicular to it.\n\nThe planes are fitted on one frame and kept fixed through the heartbeat. Moving the plane slider selects a location along the aorta; the blue square shows that cross-section in the geometry view."
      },
      {
        "title": "4. Measure area and flow",
        "text": "Adding the physical areas of pixels inside the vessel gives its cross-sectional area in cm^2. At each pixel, I take the velocity passing through the plane, multiply by pixel area, and sum to obtain flow in mL/s. Repeating this across frames produces the curves below the images.\n\nBoth the predicted and supplied masks are measured on the same planes using the same MRI-derived velocity. Their differences therefore show how the vessel outline affects the measurements."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The heart-public repository includes phase decoding, the magnitude/XYZ 3D U-Net, grouped training/evaluation, centerline fitting and plane measurements. The viewer uses saved outputs from this computational pipeline.",
    "context": "The \"4D\" means three spatial dimensions followed over time through a heartbeat. Each frame contains a magnitude image showing anatomy and phase information that encodes motion. Here, a neural network locates the aorta, then I measure how much blood passes through cross-sections along it.",
    "methodsTitle": "Velocity, anatomy and flow"
  },
  "knee": {
    "name": "Knee MRI Anatomy Segmentation and Abnormality Classification",
    "eyebrow": "03 / Knee MRI",
    "description": "Study-level abnormality classification from knee MRI, with companion anatomy segmentation and ACL/MCL attachment localization.",
    "image": "knee-preview.png",
    "try": "Browse the MRI sequences and twelve finding scores, compare anatomy overlays, and jump to ACL or MCL attachments.",
    "methods": "The V4 classifier uses MRI images and acquisition geometry to predict twelve findings across slices and sequences. A separate anatomy model outlines cartilage and menisci and locates ACL/MCL attachment points. The viewer shows both models' results together. The anatomy model's outputs are not inputs to the classifier.",
    "evidence": "One independent exam, with twelve frozen V4 finding probabilities compared against its radiology report. The ACL/MCL attachment predictions were checked visually on the images.",
    "limits": "This is a single qualitative example, not an accuracy benchmark. Finding probabilities are not calibrated clinical risk. The experimental segmentation extends past cartilage and menisci in places, and the model scores fracture above 50% although the report is negative.",
    "code": "https://github.com/michaelzenkay/knee-public",
    "codeStatus": "Public source: knee-public",
    "pipeline": [
      "Radiology reports to weak training labels",
      "MRI slices and sequences to study representation",
      "Twelve finding probabilities",
      "Separate cartilage, meniscus and ligament-attachment predictions"
    ],
    "mode": "Saved model outputs",
    "modeDetail": "Twelve study-level V4 probabilities accompany separately computed anatomy predictions.",
    "summary": "This project uses Kaggle knee MRI examinations and their radiology reports. Findings extracted from the reports provide weak training labels for twelve abnormalities. The classifier combines information across MRI slices and sequences to produce one set of finding probabilities per examination.",
    "watch": "Scroll the sequences, toggle cartilage and meniscus outlines, then jump to predicted ACL attachments on sagittal views or MCL attachments on coronal views.",
    "metric": "12",
    "metricLabel": "Finding probabilities per study",
    "metricNote": "Twelve fixed study-level scores; six displayed sequences and 307 slices. The classifier uses the five conventional sequences; 3D DESS is shown for anatomy inspection.",
    "reference": "Report findings",
    "referenceDetail": "The report notes ACL/MCL abnormalities, effusion and contusion, and the other eight findings are unremarkable. Ref + / - badges compare these labels with the model's probabilities. This exam has no reference masks or attachment coordinates.",
    "shortLimit": "Segmentation can extend past cartilage and menisci, and the fracture score disagrees with the report.",
    "stack": [
      "MRI + report-derived labels",
      "12 finding outputs",
      "KneeXNet anatomy fine-tuning"
    ],
    "references": [
      [
        "KneeXNet-2.5D upstream model",
        "https://github.com/pitthexai/Knee_MRI_Segmentation_2.5D"
      ],
      [
        "DINOv2 image encoder",
        "https://github.com/facebookresearch/dinov2"
      ]
    ],
    "methodDetails": [
      {
        "title": "Data and preprocessing",
        "text": "Radiology reports supply weak finding labels for training; inference uses MRI and acquisition geometry. DICOM slices are ordered physically and intensity-transformed. A frozen ACL localizer anchors a crop expanded to retain the tissue envelope, with a full-field fallback. This crop localizer is separate from the companion anatomy model."
      },
      {
        "title": "Finding classification",
        "text": "DINOv2 small/14 encodes MRI slices. Finding-specific spatial queries, depth attention and sequence attention produce twelve study-level sigmoid scores. Training first fits aggregation heads, then fine-tunes the encoder using soft-label BCE and AdamW. The current trainer selects by mean development AUC across the twelve findings and reports each finding's AUC separately."
      },
      {
        "title": "Companion anatomy",
        "text": "Adjacent-slice triplets feed a KneeXNet-initialized ResNet-34 U-Net for femoral, tibial and patellar cartilage and meniscus segmentation. My non-expert femoral/tibial point annotations train custom ACL/MCL heads sharing its encoder and decoder. Each endpoint combines a predicted slice with an in-plane heatmap centroid: ACL on sagittal series, MCL on coronal series."
      },
      {
        "title": "Anatomy training and evaluation",
        "text": "Segmentation loss combines BCE and Dice only for annotated classes. Attachment losses supervise slice presence, heatmap location and endpoint separation. The source provides Dice evaluation for supervised structures and endpoint distance in physical millimetres. These are evaluated separately from finding AUC."
      },
      {
        "title": "Display method",
        "text": "The viewer reads fixed V4 scores and separately computed anatomy predictions. Scores above 50% are highlighted. Fine-tuned and original KneeXNet masks can be compared where available on the same sagittal slice; ACL/MCL points show predicted attachments."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The knee-public repository includes DICOM preprocessing, the V4 classifier and frozen crop localizer, companion anatomy inference, and training/evaluation methods for classification and anatomy.",
    "context": "Companion anatomy outputs combine cartilage/meniscus segmentation fine-tuned from KneeXNet-2.5D with custom ACL/MCL attachment localization trained from my non-expert point annotations. The demo shows the classification and anatomy outputs together on an anonymized personal examination, separate from the Kaggle examples.",
    "methodsTitle": "Finding classification and anatomy"
  }
};
