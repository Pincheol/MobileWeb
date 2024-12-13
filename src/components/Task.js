import React, { useState } from "react";
import { View } from "react-native";
import styled from "styled-components/native";
import PropTypes from "prop-types";
import IconButton from "./IconButton";
import { images } from "../images";
import Input from "./input";

const Container = styled.View`
    flex-direction: row;
    align-items: center;
    background-color: ${({ theme }) => theme.itemBackground};
    border: 2px solid #cccccc; /* 테두리 추가 */
    border-radius: 20px;
    padding: 10px;
    margin: 5px 0px;
`;

const DateText = styled.Text`
    font-size: 14px;
    color: ${({ theme }) => theme.text};
    margin-bottom: 5px;
`;

const Contents = styled.Text`
    flex: 1;
    font-size: 18px;
    color: ${({ theme, completed }) => (completed ? theme.done : theme.text)};
    text-decoration-line: ${({ completed }) =>
        completed ? "line-through" : "none"};
`;

const Task = ({ item, deleteTask, updateTask }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);
    const [completed, setCompleted] = useState(item.completed); // 내부에서 상태 관리

    // 업데이트 버튼을 눌렀을 때
    const _handleUpdateButtonPress = () => {
        setIsEditing(true);
    };

    const _onBlur = () => {
        if (isEditing) {
            setIsEditing(false);
            setText(item.text);
        }
    };

    const _onSubmitEditing = () => {
        if (isEditing) {
            const editedTask = Object.assign({}, item, { text });
            setIsEditing(false);
            updateTask(editedTask);
        }
    };

    const handleToggleTask = () => {
        setCompleted(!completed); // 체크박스 클릭 시 completed 상태 변경
    };

    return isEditing ? (
        <Input
            value={text}
            onChangeText={(text) => setText(text)}
            onSubmitEditing={_onSubmitEditing}
            onBlur={_onBlur}
        />
    ) : (
        <Container>
            <IconButton
                type={completed ? images.completed : images.uncompleted}
                id={item.id}
                onPressOut={handleToggleTask}  // 체크 버튼 누르면 상태 토글
                completed={completed}
            />
            <View style={{ flex: 1 }}>
                <DateText>{item.date}</DateText>
                <Contents completed={completed}>{text}</Contents>
            </View>
            {completed || (
                <>
                    <IconButton
                        type={images.update}
                        onPressOut={_handleUpdateButtonPress}
                    />
                </>
            )}
            <IconButton
                type={images.delete}
                id={item.id}
                onPressOut={deleteTask}
                completed={completed}
            />
        </Container>
    );
};

Task.propTypes = {
    item: PropTypes.object.isRequired,
    deleteTask: PropTypes.func.isRequired,
    updateTask: PropTypes.func.isRequired,
};

export default Task;
