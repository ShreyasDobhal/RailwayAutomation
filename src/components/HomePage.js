

import React, {Component} from 'react';
import DragAndDrop from './DragAndDrop';
import Select from 'react-select'
import { Spinner } from 'reactstrap';

const ExcelJS = require('exceljs');
var FileSaver = require('file-saver');

const stationOptions = require('../data.json');

class HomePage extends Component {

    state = {
        inputFile: null,

        trainNumber: null,
        stationNames: [],
        stationCodes: [],
        stationDates: [],

        loading: false,

        isDownloaded: false,
    }

    constructor(props) {
        super(props);
        this.typeaheadRef = React.createRef();
    }

    onFileUploadHandler = (event)=> {
        this.handleDrop(event.target.files);
    }

    handleDrop = (files) => {
        console.log("Uploading files",files);
        let file = null;
        for (let i=0;i<files.length;i++) {
            if (!files[i].name)
                return;
            file = files[i];
        }
        console.log("Uploaded",file.name);
        this.setState({
            inputFile: file,
            isDownloaded: false,
            trainNumber: null,
            stationNames: [],
            stationCodes: [],
            stationDates: []
        });
    }

    getCellData = (data, index) => {
        const time_cell = [1, 2];
        const number_cell = [12, 13];
        let txt = '';

        if (!data[index+1])
            return txt
        
        if (time_cell.includes(index)) {
            let d = new Date(data[index+1]);
            let month = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            let year = d.getFullYear();

            if (month.length < 2) 
                month = '0' + month;
            if (day.length < 2) 
                day = '0' + day;

            txt = [year, month, day].join('-');
        } else if (number_cell.includes(index)) {
            txt = data[index+1].toString();
        }else {
            txt = data[index+1];
        }
        
        return txt;
    }
    
    getHeading = (train, date, station) => {
        return 'LIST OF PASSENGERS DEBOARDING AT ' + station + ' FROM TRAIN No ' + train + ' DATED ' + date;
    }

    getColumnHeader = (index) => {
        const header = ['SL NO.', 'TRN SRC DATE', 'JRNY DATE', 'TRNNO', 'CLS',
                  'FROM STN', 'TO STN', 'BOARDING POINT', 'ENRT STN', 
                  'PSGN NAME', 'AGE', 'GENDER', 'MOBNO', 'PNR NO', 'COACHNO',
                  'BERTHNO RACNO WLNO', 'BKG LOC ID', 'PNRTKTTYPE', 'DESTINATION ADDRESS'];
        return header[index];
    }

    getColumnWidth = (index) => {
        const width = [7, 14, 14, 10, 10, 10, 10, 21, 14, 28, 10, 14, 18, 18,
                 14, 27, 14, 14, 120];
        return width[index]
    }

    getTextMessage = () => {

        let dateMap = {};
        for (let i = 0; i < this.state.stationDates.length; i++) {
            let currentDate = this.state.stationDates[i];
            if (!(currentDate in dateMap))
                dateMap[currentDate] = [];
            dateMap[currentDate].push(this.state.stationCodes[i]);
        }

        let message = '';
        console.log(dateMap);
        for (let key in dateMap) {
            message = message + `LIST OF PASSENGERS DEBOARDING AT *${dateMap[key].join(' ')}* FROM TRAIN NO ${this.state.trainNumber} DATED ${key} 👇 \n`;
        }

        return message;
        
    }

    createWorkbook = () => {
        const emptyMessage = 'No matching records found';
        const outputFile = this.state.trainNumber+'.xlsx';
        
        const inputWorkbook = new ExcelJS.Workbook();
        const outputWorkbook = new ExcelJS.Workbook();
        const reader = new FileReader();

        // Reading input file
        reader.readAsArrayBuffer(this.state.inputFile);
        reader.onload = () => {
            const buffer = reader.result;
            inputWorkbook.xlsx.load(buffer).then(inputWorkbook => {
                const sheet = inputWorkbook.worksheets[0];

                for (let i = 0; i < this.state.stationCodes.length; i++) {
                    const stationCode = this.state.stationCodes[i];
                    const stationName = this.state.stationNames[i];
                    const stationDate = this.state.stationDates[i];

                    // Adding sheet
                    const worksheet = outputWorkbook.addWorksheet(stationCode);

                    // Adding conditional formatting
                    worksheet.addConditionalFormatting({
                        ref: 'A1:S1000',
                        rules: [{
                            type: 'expression',
                            formulae: ['AND(ISEVEN(ROW()),NOT(ROW()=2))'],
                            style: {
                                fill: {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    bgColor: {argb: 'ffe1f2ff'}
                                }
                            }
                        }]
                    });

                    // Adding heading
                    worksheet.mergeCells('A1:S1');
                    worksheet.getCell('A1').value = this.getHeading(this.state.trainNumber, stationDate, stationName);
                    worksheet.getCell('A1').alignment = { horizontal: 'center'};
                    worksheet.getCell('A1').font = { name:'Cambria', size: 18, bold: true, color: {argb: 'ff1f497d'}};

                    // Adding column headers
                    for (let col=0; col<19; col++) {
                        let cellIndex = String.fromCharCode(65+col)+'2';
                        worksheet.getCell(cellIndex).value = this.getColumnHeader(col);
                        worksheet.getCell(cellIndex).alignment = { horizontal: 'center'};
                        worksheet.getCell(cellIndex).font = { name:'Calibri', size: 12, bold: true, color: {argb: 'ffffffff'}};
                        worksheet.getCell(cellIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff0070c0'}};
                        worksheet.getColumn(col+1).width = this.getColumnWidth(col);
                    }

                    // Copying data
                    let SN = 1;
                    sheet.eachRow({ includeEmpty: true }, (rowData, rowNumber) => {
                        if (rowNumber > 6) {
                            let row = rowData.values;
                            if (row[7] === stationCode) {
                                for (let col=0; col<19; col++) {
                                    if (col===0) {
                                        worksheet.getCell(String.fromCharCode(65+col)+(SN+2)).value = SN;
                                    } else {
                                        worksheet.getCell(String.fromCharCode(65+col)+(SN+2)).value = this.getCellData(row, col);
                                    }
                                }
                                SN+=1;
                            }
                        }
                    });

                    // No data found
                    if (SN===1) {
                        worksheet.mergeCells('A3:S3');
                        worksheet.getCell('A3').value = emptyMessage;
                        worksheet.getCell('A3').alignment = { horizontal:'center'};
                    }
                }

                // Saving file
                outputWorkbook.xlsx.writeBuffer()
                    .then(buffer => {
                        FileSaver.saveAs(new Blob([buffer]), outputFile);
                        this.setState({
                            loading: false,
                            inputFile: null,
                            isDownloaded: true
                        });
                    })
                    .catch(err => {
                        console.log('Error writing excel export', err);
                        alert('Failed to create the report');
                    });
                
            });
        }

    }

    stationsChangeHandler = (values) => {
        let stationCodes = [];
        let stationNames = [];

        for (let i=0;values && i<values.length;i++) {
            stationCodes.push(values[i].value);
            stationNames.push(values[i].label);
        }

        console.log(values);

        this.setState({stationCodes, stationNames});
    }

    dateChangeHandler = (event) => {
        let dates = event.target.value;
        if (!dates)
            return;
        
        let dateArray = dates.split(' ');
        let stationDates = [];
        for (let i=0;i<dateArray.length;i++) {
            let stationDate = dateArray[i].trim();
            if (stationDate && stationDate !== '')
                stationDates.push(stationDate);
        }

        this.setState({stationDates});
    }

    submitHandler = () => {

        if (!this.state.trainNumber || this.state.trainNumber === '' ||
            !this.state.stationNames || this.state.stationNames === [] ||
            !this.state.stationDates || this.state.stationDates === []) {
            alert('Enter valid details');
            return;
        } else if (this.state.stationCodes.length !== this.state.stationDates.length) {
            alert("Number of dates and stations doesn't match");
            return;
        }

        this.setState({loading: true});
        this.createWorkbook();
    }

    copyToClipboard = (text) => {
        let textField = document.createElement('textarea');
        textField.innerText = text;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand('copy');
        textField.remove();
    }

    handleCopyButton = () => {
        // Generating text message and copying it
        const message = this.getTextMessage();
        // const message = 'Hello World';
        this.copyToClipboard(message);

        const x = document.getElementById("snackbar");
        x.className = "show";
        setTimeout(() => { x.className = x.className.replace("show", ""); }, 3000);
    }

    render() {

        return (
            <DragAndDrop handleDrop={this.handleDrop}>
                <div className='page-container'>
                    <div id="snackbar">Message copied !</div>
                    <img src='excel.png' className='water-mark' alt='excel watermark'/>
                    {this.state.loading ? (
                        <Spinner animation="border" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                    ) : null}

                    {this.state.isDownloaded ? (
                       <button className='copy-btn' onClick={this.handleCopyButton}>Copy message</button>
                    ):null}

                    {this.state.inputFile ? (
                        <div className='container'>
                            <p>{this.state.inputFile.name}</p>
                            <input className='input-field' type='text' placeholder='Enter train number' onChange={(event) => {this.setState({trainNumber: event.target.value})}}/>
                            <Select ref={this.typeaheadRef} options={stationOptions} isMulti className='input-typeahead' onChange={this.stationsChangeHandler}/>
                            <input className='input-field' type='text' placeholder='Enter arrival dates eg. 26.10.2020, 27.10.2020' onChange={this.dateChangeHandler}/>
                            <div className='upload-btn-container'>
                                <button className='upload-btn' onClick={this.submitHandler}>Submit</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor='fileUpload' className='upload-btn'>Upload a file</label>
                            <input id='fileUpload' className='upload-input' type='file' accept=".xlsx" onChange={this.onFileUploadHandler} multiple/>
                        </div>
                    )}

                    
                </div>
            </DragAndDrop>
            
        );
    }
}

export default HomePage