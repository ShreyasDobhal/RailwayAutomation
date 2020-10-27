import React from 'react';
import Select from 'react-select'


const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
]


const TypeAhead = (props) => (
    <Select ref={props.reference} options={props.options} isMulti className='input-typeahead'/>
);

export default TypeAhead;