import React, {Component} from 'react';

class DragAndDrop extends Component {

    state = {
        drag: false
    }

      
    dropRef = React.createRef()

    handleDragIn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter++;
        if (e.dataTransfer.items && e.dataTransfer.items.length>0) {
            this.setState({
                drag:true
            })
        }
    }

    handleDragOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter--;
        if (this.dragCounter>0) 
            return
        this.setState({
            drag:false
        })
    }

    handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            drag:false
        });
        if (e.dataTransfer.files && e.dataTransfer.files.length>0) {
            this.props.handleDrop(e.dataTransfer.files);
            e.dataTransfer.clearData();
            this.dragCounter=0;
        }
    }

    componentDidMount() {
        this.dragCounter=0;
        let div = this.dropRef.current;
        div.addEventListener('dragenter',this.handleDragIn);
        div.addEventListener('dragleave',this.handleDragOut);
        div.addEventListener('dragover',this.handleDrag);
        div.addEventListener('drop',this.handleDrop);
    }

    componentWillUnmount() {
        let div = this.dropRef.current;
        div.removeEventListener('dragenter',this.handleDragIn);
        div.removeEventListener('dragleave',this.handleDragOut);
        div.removeEventListener('dragover',this.handleDrag);
        div.removeEventListener('drop',this.handleDrop);
    }

    render() {
        return (
            <div className='drag-drop-outer-container' ref={this.dropRef}>
                {this.state.drag &&
                    <div className='drag-drop-overlay'>
                        <div className='drag-drop-overlay-text'>
                            <div>Drop here</div>
                        </div>
                    </div>
                }
                {this.props.children}
            </div>
        );
    }
}

export default DragAndDrop;