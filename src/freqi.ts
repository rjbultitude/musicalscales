var __PROD__ = process.env.NODE_ENV !== 'test';
/*
    By Richard Bultitude
    github.com/rjbultitude
*/

// Constants
const CHROMATIC_SCALE : Array<string> = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface UserConfigObj {
  intervals: Array<number>
  startFreq?: number,
  numSemitones?: number,
  rootNote?: number,
  numNotes?: number,
  amountToAdd?: number,
  intervalStartIndex?: number,
  repeatMultiple?: number,
  type?: string
}

interface PConfigObj {
  scaleIntervals: Array<number>,
  numNotes : number,
  intervalStartIndex: number,
  repeatMultiple: number,
  amountToAdd: number,
  type?: string
}

interface ETNoteConfig {
  interval: number,
  startFreq: number,
  upwardsScale?: boolean,
  numSemitones: number,
}

interface AugArrConfig {
  originalArray: Array<number>,
  difference: number,
  repeatMultiple: number,
  amountToAdd?: number
}

function reallyIsNaN(x: any) {
  return x !== x;
}

function checkAugmentNumArrayConfigTypes(augArrConfig: AugArrConfig) {
  if (Array.isArray(augArrConfig.originalArray) !== true) {
    throw TypeError('originalArray is not an array');
  } else {
    for (var i = 0; i < augArrConfig.originalArray.length; i++) {
      if (reallyIsNaN(augArrConfig.originalArray[i])) {
        throw TypeError('originalArray contains values that are NaN');
      }
    }
  }
  if (typeof augArrConfig.difference !== 'number' || Number.isNaN(augArrConfig.difference)) {
    throw TypeError('difference is not a number');
  }
  if (augArrConfig.difference <= 0) {
    throw TypeError('difference cannot be 0 or less');
  }
  if (typeof augArrConfig.repeatMultiple !== 'number' || Number.isNaN(augArrConfig.repeatMultiple)) {
    throw TypeError('repeatMultiple is not a number');
  }
  if (typeof augArrConfig.amountToAdd !== 'number' || Number.isNaN(augArrConfig.amountToAdd)) {
    throw TypeError('amountToAdd is not a number');
  }
}

function checkAugmentNumArrayConfigForNegs(augArrConfig: AugArrConfig) {
  if (augArrConfig.difference <= 0) {
    throw SyntaxError('difference should be higher than 0');
  }
  if (augArrConfig.repeatMultiple < 0) {
    throw SyntaxError('repeatMultiple should be 0 or higher');
  }
  if (augArrConfig.amountToAdd < 0) {
    throw SyntaxError('amountToAdd should be 0 or higher');
  }
}

/**
 * Duplicates items 'difference' number of times
 * Can add a given amount to each duplicated item if desired
 * Can start from beginning of array
 * after repeatMultiple number of times
 * @param  {Object} augArrConfig    [config object]
 * @return {Array}                  [new array]
 */
function augmentNumArray(augArrConfig: AugArrConfig): Array<number> {
  var _index = 0;
  // error check
  try {
    checkAugmentNumArrayConfigTypes(augArrConfig);
  } catch (e) {
    if (__PROD__) {
      console.error(e);
    }
    return [];
  }
  try {
    checkAugmentNumArrayConfigForNegs(augArrConfig);
  } catch (e) {
    if (__PROD__) {
      console.error(e);
    }
    return [];
  }
  // begin fn
  var _newArr = augArrConfig.originalArray.map(function (item) {
    return item;
  });
  var _finalArr: Array<number> = [];
  var _diffArr: Array<number> = [];
  var _newVal;
  var _repeatPoint: number = (augArrConfig.originalArray.length * augArrConfig.repeatMultiple) - 1;
  // loop the number of times
  // needed to make the missing items
  addMissingLoop:
  for (var i = 0; i < augArrConfig.difference; i++) {
    _newVal = _newArr[_index];
    // Add the extra amount
    // if we're dealing with numbers
    if (typeof augArrConfig.amountToAdd === 'number' && typeof _newVal === 'number') {
      _newVal += augArrConfig.amountToAdd;
    }
    _diffArr.push(_newVal);
    // Start from 0 index
    if (i === _repeatPoint) {
      _index = 0;
      augArrConfig.amountToAdd = 0;
      continue addMissingLoop;
    } else if (_index === augArrConfig.originalArray.length - 1) {
      _index = 0;
      augArrConfig.amountToAdd += augArrConfig.amountToAdd;
      continue addMissingLoop;
    }
    _index += 1;
  }
  _finalArr = _newArr.concat(_diffArr);
  return _finalArr;
}

function isPropValid(prop, inValidKeys) {
  for (var i = 0; i < inValidKeys.length; i++) {
    if (prop === inValidKeys[i]) {
      return false;
    }
  }
  return true;
}

/**
 * ------------
 * Equal temperament data sanitisation
 * ------------
 */

function checkGetSingleFreqConfigForNegs(dataObj) {
  var invalidKeys = ['interval', 'upwardsScale'];
  for (var prop in dataObj) {
    if (isPropValid(prop, invalidKeys)) {
      if (dataObj[prop] < 0) {
        throw new SyntaxError(prop + ' must be a positive number');
      }
    }
  }
}

function checkGetSingleFreqConfigDataTypes(dataObj) {
  for (var prop in dataObj) {
    if (prop !== 'upwardsScale') {
      if (typeof dataObj[prop] !== 'number' || Number.isNaN(dataObj[prop])) {
        throw new TypeError('Config property ' + prop + ' is not a number');
      }
    } else {
      if (typeof dataObj[prop] !== 'boolean') {
        throw new TypeError('Config property ' + prop + ' is not a boolean');
      }
    }
  }
  return true;
}

/**
* ------------
* Musical Scale data sanitisation
* ------------
*/

function checkGetFreqsForZerosNegs(data) {
  var invalidKeys = ['intervals', 'type', 'rootNote'];
  Object.keys(data).forEach(function (prop) {
    if (isPropValid(prop, invalidKeys)) {
      if (prop === 'numSemitones' && data[prop] === 0) {
        throw new SyntaxError('numSemitones must be a positive number');
      }
      if (data[prop] < 0) {
        throw new SyntaxError(prop + ' must be zero or a positive number');
      }
    }
  });
}

function checkGetFreqsNumericDataTypes(dataObj) {
  Object.keys(dataObj).forEach(function (prop) {
    // Check numeric values
    if (prop !== 'type' && prop !== 'intervals') {
      if (typeof dataObj[prop] !== 'number' || Number.isNaN(dataObj[prop])) {
        throw new TypeError('Config property ' + prop + ' is not a number');
      }
    }
  });
  return true;
}

function checkGetFreqsIntervalsProp(intervals: Array<number>) {
  if (Array.isArray(intervals) !== true) {
    throw new TypeError('intervals is not an array');
  }
  if (intervals.length === 0) {
    throw new TypeError('intervals array is empty');
  }
  for (var i = 0, length = intervals.length; i < length; i++) {
    if (typeof intervals[i] !== 'number' || Number.isNaN(intervals[i])) {
      throw new TypeError('intervals is not an array of numbers');
    }
  }
}

/**
 * ------------
 * Constructors
 * ------------
 */

function GetFreqsConfig(configObj: UserConfigObj) {
  // Start frequency
  this.startFreq = configObj.startFreq === undefined ? 440 : configObj.startFreq;
  // Number of semitones in octave
  this.numSemitones = configObj.numSemitones === undefined ? 12 : configObj.numSemitones;
  // Index for start note in scale/chord
  this.rootNote = configObj.rootNote === undefined ? 0 : configObj.rootNote;
  // Pattern to use when using inversions
  this.intervalStartIndex = configObj.intervalStartIndex === undefined ? 0 : configObj.intervalStartIndex;
  // Pattern to use for playback play
  this.intervals = configObj.intervals;
  // The number of times we want to start from the beginning of the intervals arr again
  this.repeatMultiple = configObj.repeatMultiple === undefined ? 0 : configObj.repeatMultiple;
  // For debugging
  this.type = configObj.type || 'unknown';

  // Optional extras for handling interval arrays
  // which are of a different length
  // to the desired number of notes

  // Total number of desired notes in the scale
  this.numNotes = configObj.numNotes;
  // How many notes to add if items are missing
  this.amountToAdd = configObj.amountToAdd === undefined ? this.numSemitones : configObj.amountToAdd;
}

/**
* ------------
* Main module functions
* ------------
*/

function getSingleFreq(eTNoteConfig: ETNoteConfig) {
  try {
    checkGetSingleFreqConfigDataTypes(eTNoteConfig);
  } catch (e) {
    if (__PROD__) {
      console.error(e);
    }
    return false;
  }
  try {
    checkGetSingleFreqConfigForNegs(eTNoteConfig);
  } catch (e) {
    if (__PROD__) {
      console.error(e);
    }
    return false;
  }
  var _intervalIsPos = eTNoteConfig.interval >= 0;
  var _up = eTNoteConfig.upwardsScale === undefined ? _intervalIsPos : eTNoteConfig.upwardsScale;
  var _note = null;
  if (_up) {
    _note = eTNoteConfig.startFreq * Math.pow(2, eTNoteConfig.interval / eTNoteConfig.numSemitones);
  } else {
    _note = eTNoteConfig.startFreq / Math.pow(2, Math.abs(eTNoteConfig.interval) / eTNoteConfig.numSemitones);
  }
  return _note;
}

// Adds new items to the intervals array
// should it not have enough notes
function addMissingNotesFromInterval(pConfig: PConfigObj): Array<number> {
  var _intervals:Array<number> = [];
  var _highestIndex = pConfig.intervalStartIndex + pConfig.numNotes;
  var _intervalsLength = pConfig.scaleIntervals.length;
  if (_highestIndex > _intervalsLength) {
    var _diff = _highestIndex - _intervalsLength;
    _intervals = augmentNumArray({
      originalArray: pConfig.scaleIntervals,
      difference: _diff,
      amountToAdd: pConfig.amountToAdd,
      repeatMultiple: pConfig.repeatMultiple,
    });
  } else {
    _intervals = pConfig.scaleIntervals;
  }
  return _intervals;
}

function getNotesFromIntervals(pConfig) {
  var _scaleArray = [];
  // For Inversions or rootless voicings
  var _intervalStartIndex = pConfig.intervalStartIndex;
  var _newNote;
  for (var i = 0; i < pConfig.loopLength; i++) {
    // __PROD__ && console.log('note ' + i + ' ' + pConfig.type);
    // __PROD__ && console.log('scaleInterval', pConfig.scaleIntervals[_intervalStartIndex]);
    // __PROD__ && console.log('intervaloffset ' + _intervalStartIndex + ' centreNote Index ' + pConfig.rootNote);
    var finalIndex = pConfig.scaleIntervals[_intervalStartIndex] + pConfig.rootNote;
    // __PROD__ && console.log('final highest Index', finalIndex);
    _newNote = getSingleFreq({
      startFreq: pConfig.startFreq,
      numSemitones: pConfig.numSemitones,
      interval: finalIndex,
    });
    // Error check
    if (_newNote !== undefined || Number.isNaN(_newNote) === false) {
      _scaleArray.push(_newNote);
    } else if (__PROD__) {
      console.error('undefined or NaN note');
    }
    _intervalStartIndex += 1;
  }
  return _scaleArray;
}

// Accepts only an object
function getFreqs(msConfig) {
  var _validConfig;
  // Check config exists
  if (typeof msConfig !== 'object') {
    if (__PROD__) {
      console.error('Musical Scale Config should be an object');
    }
  // Check and fix undefined
  } else {
    _validConfig = new GetFreqsConfig(msConfig);
  }
  try {
    checkGetFreqsIntervalsProp(_validConfig.intervals);
  } catch (e) {
    if (__PROD__) {
      console.error(e);
    }
    return false;
  }
  // Ensure numNotes is set
  if (_validConfig.numNotes === undefined) {
    _validConfig.numNotes = _validConfig.intervals.length;
  }
  // Check all data types
  try {
    checkGetFreqsNumericDataTypes(msConfig);
  } catch (e) {
    if (__PROD__) {
      console.error('Check your config values are valid', e);
    }
    return false;
  }
  // Check for negative numbers
  try {
    checkGetFreqsForZerosNegs(msConfig);
  } catch (e) {
    if (__PROD__) {
      console.error('Check your config values are valid', e);
    }
    return false;
  }
  // Set vars
  var _scaleArray = [];
  var _intervals = _validConfig.intervals;
  // Add missing scale intervals
  var _intervalsFull = addMissingNotesFromInterval({
    amountToAdd: _validConfig.amountToAdd,
    intervalStartIndex: _validConfig.intervalStartIndex,
    numNotes: _validConfig.numNotes,
    repeatMultiple: _validConfig.repeatMultiple,
    scaleIntervals: _intervals,
    type: _validConfig.type,
  });
  // Inversions are acheived by
  // selecting an index from within the intervals themselves
  var _loopLength = _intervalsFull.length - _validConfig.intervalStartIndex;
  // Where the magic happens
  _scaleArray = getNotesFromIntervals({
    startFreq: _validConfig.startFreq,
    scaleIntervals: _intervalsFull,
    numSemitones: _validConfig.numSemitones,
    rootNote: _validConfig.rootNote,
    intervalStartIndex: _validConfig.intervalStartIndex,
    loopLength: _loopLength,
    type: _validConfig.type,
  });
  return _scaleArray;
}

export default {
  getFreqs: getFreqs,
  augmentNumArray: augmentNumArray,
  getSingleFreq: getSingleFreq,
  CHROMATIC_SCALE: CHROMATIC_SCALE,
};
